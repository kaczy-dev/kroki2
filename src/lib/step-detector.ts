/**
 * Advanced peak-detection step counter.
 * 
 * Signal processing pipeline:
 * 1. Compute acceleration magnitude
 * 2. High-pass filter to remove gravity (DC offset)
 * 3. Low-pass filter to remove high-freq noise (jitter)
 * 4. Peak detection with adaptive threshold
 * 5. Timing validation (min/max interval between steps)
 * 6. Regularity check (consistent cadence = higher confidence)
 */
export class StepDetector {
  // Filter state
  private hpPrev = 0;        // high-pass previous input
  private hpOut = 0;         // high-pass previous output
  private lpOut = 0;         // low-pass output
  private prevLp = 0;        // previous LP output for derivative
  private prevDelta = 0;     // previous derivative sign

  // Peak detection
  private lastStepAt = 0;
  private samplesSincePeak = 0;

  // Adaptive threshold
  private peakHistory: number[] = [];
  private readonly peakHistorySize = 12;

  // Timing
  private stepIntervals: number[] = [];
  private readonly intervalHistorySize = 8;

  // Tuning parameters
  private readonly hpAlpha = 0.85;    // high-pass filter (removes gravity/DC, keeps 1-4Hz walking)
  private readonly lpAlpha = 0.25;    // low-pass filter (smooths noise, keeps walking freq)
  private readonly minInterval = 250; // min ms between steps (~4 steps/s max = running)
  private readonly maxInterval = 2000; // max ms between steps (slower = not walking)
  private readonly minPeakAbs = 0.6;  // absolute minimum peak amplitude
  private readonly minSamplesBetweenPeaks = 4; // anti-bounce: need N samples between peaks

  reset() {
    this.hpPrev = 0;
    this.hpOut = 0;
    this.lpOut = 0;
    this.prevLp = 0;
    this.prevDelta = 0;
    this.lastStepAt = 0;
    this.samplesSincePeak = 0;
    this.peakHistory = [];
    this.stepIntervals = [];
  }

  /**
   * Feed accelerometer data. Returns true when a step is detected.
   * @param x - acceleration X (m/s²)
   * @param y - acceleration Y (m/s²)
   * @param z - acceleration Z (m/s²)
   * @param t - timestamp (ms), defaults to performance.now()
   */
  push(x: number, y: number, z: number, t: number = performance.now()): boolean {
    // 1. Compute magnitude
    const mag = Math.sqrt(x * x + y * y + z * z);

    // 2. High-pass filter: removes gravity (DC component)
    // y[n] = alpha * (y[n-1] + x[n] - x[n-1])
    this.hpOut = this.hpAlpha * (this.hpOut + mag - this.hpPrev);
    this.hpPrev = mag;

    // 3. Low-pass filter on the HP output to smooth noise
    // y[n] = alpha * x[n] + (1-alpha) * y[n-1]
    this.lpOut = this.lpAlpha * Math.abs(this.hpOut) + (1 - this.lpAlpha) * this.lpOut;

    this.samplesSincePeak++;

    // 4. Compute derivative
    const delta = this.lpOut - this.prevLp;
    this.prevLp = this.lpOut;

    // 5. Detect peak: derivative crosses from positive to negative
    const isPeakCandidate = this.prevDelta > 0 && delta <= 0;
    this.prevDelta = delta;

    if (!isPeakCandidate) return false;

    // 6. Anti-bounce: require minimum samples between peaks
    if (this.samplesSincePeak < this.minSamplesBetweenPeaks) return false;

    // 7. Amplitude check: peak must be significant
    const peakValue = this.lpOut;
    if (peakValue < this.minPeakAbs) return false;

    // 8. Adaptive threshold: peak must exceed average of recent peaks * factor
    const adaptiveThreshold = this.getAdaptiveThreshold();
    if (peakValue < adaptiveThreshold) return false;

    // 9. Timing check
    const interval = t - this.lastStepAt;
    if (this.lastStepAt > 0 && interval < this.minInterval) return false;

    // If interval > maxInterval, it's a new walking bout — allow it
    // but don't require regular cadence

    // Step confirmed!
    this.lastStepAt = t;
    this.samplesSincePeak = 0;

    // Update peak history for adaptive threshold
    this.peakHistory.push(peakValue);
    if (this.peakHistory.length > this.peakHistorySize) {
      this.peakHistory.shift();
    }

    // Track intervals for cadence regularity
    if (interval > 0 && interval < this.maxInterval) {
      this.stepIntervals.push(interval);
      if (this.stepIntervals.length > this.intervalHistorySize) {
        this.stepIntervals.shift();
      }
    }

    return true;
  }

  /** Adaptive threshold: 40% of average recent peak amplitude, with absolute floor */
  private getAdaptiveThreshold(): number {
    if (this.peakHistory.length < 3) return this.minPeakAbs;
    const avg = this.peakHistory.reduce((s, v) => s + v, 0) / this.peakHistory.length;
    return Math.max(this.minPeakAbs, avg * 0.4);
  }

  /** Get current step regularity (0-1). Higher = more consistent walking pattern */
  getRegularity(): number {
    if (this.stepIntervals.length < 3) return 0;
    const avg = this.stepIntervals.reduce((s, v) => s + v, 0) / this.stepIntervals.length;
    const variance = this.stepIntervals.reduce((s, v) => s + (v - avg) ** 2, 0) / this.stepIntervals.length;
    const stddev = Math.sqrt(variance);
    // CV (coefficient of variation): lower = more regular
    const cv = stddev / avg;
    // Map CV to 0-1 regularity: CV<0.15 = very regular, CV>0.5 = irregular
    return Math.max(0, Math.min(1, 1 - (cv - 0.1) / 0.4));
  }

  /** Get estimated cadence (steps/min) from recent intervals */
  getCadence(): number {
    if (this.stepIntervals.length < 2) return 0;
    const avgInterval = this.stepIntervals.reduce((s, v) => s + v, 0) / this.stepIntervals.length;
    return Math.round(60000 / avgInterval);
  }

  /** Check if the detector thinks user is actively walking */
  isWalking(): boolean {
    if (this.lastStepAt === 0) return false;
    const elapsed = performance.now() - this.lastStepAt;
    return elapsed < this.maxInterval;
  }
}
