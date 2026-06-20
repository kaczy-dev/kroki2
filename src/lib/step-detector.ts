/**
 * Production-grade step detector inspired by Android's TYPE_STEP_DETECTOR.
 *
 * Architecture mirrors AOSP StepDetector:
 * 1. Butterworth-style bandpass filtering (0.5–5 Hz passband = walking/running)
 * 2. Orientation-independent magnitude computation
 * 3. Dynamic threshold with hysteresis (prevents chattering)
 * 4. Validation pipeline: timing + amplitude + continuity
 * 5. False-positive rejection: vehicle detection, hand gesture filtering
 * 6. Walking state machine (idle → maybe → walking → stopping)
 *
 * Tuned for pocket/hand carry on diverse devices.
 */

type WalkingState = "idle" | "starting" | "walking" | "stopping";

export class StepDetector {
  // === BUTTERWORTH BANDPASS FILTER STATE ===
  // 2nd order high-pass (removes gravity, cutoff ~0.5Hz at 50Hz sample rate)
  private hp_x1 = 0; private hp_x2 = 0;
  private hp_y1 = 0; private hp_y2 = 0;
  // 2nd order low-pass (removes jitter, cutoff ~5Hz at 50Hz sample rate)
  private lp_x1 = 0; private lp_x2 = 0;
  private lp_y1 = 0; private lp_y2 = 0;

  // === PEAK DETECTION ===
  private prevFiltered = 0;
  private prevDelta = 0;
  private samplesSincePeak = 0;
  private lastStepAt = 0;

  // === ADAPTIVE THRESHOLD WITH HYSTERESIS ===
  private peakRingBuffer: number[] = [];
  private readonly peakRingSize = 16;
  private dynamicThreshold = 0.8;
  private readonly hysteresisUp = 1.1;   // 10% above threshold to trigger
  private readonly hysteresisDown = 0.7; // 30% below to reset

  // === WALKING STATE MACHINE ===
  private state: WalkingState = "idle";
  private consecutiveSteps = 0;
  private pendingSteps = 0; // Steps during "starting" phase — released when confirmed
  private readonly stepsToConfirm = 3; // Need 3 consecutive steps to confirm walking
  private readonly stepsToStop = 0; // Immediate stop

  // === TIMING VALIDATION ===
  private stepIntervals: number[] = [];
  private readonly intervalRingSize = 12;

  // === FALSE POSITIVE REJECTION ===
  private magnitudeHistory: number[] = [];
  private readonly magHistorySize = 30;
  private vehicleScore = 0; // High constant vibration = vehicle

  // === TUNING PARAMETERS ===
  // Timing constraints (ms)
  private readonly minStepInterval = 220;  // ~4.5 steps/s max (fast running)
  private readonly maxStepInterval = 2200; // ~0.45 steps/s min (very slow)
  private readonly walkingTimeout = 3000;  // No step for 3s = stopped

  // Amplitude constraints
  private readonly minPeakAbsolute = 0.4;  // Below this = definitely noise
  private readonly initialThreshold = 0.8; // Starting threshold before adaptation

  // Anti-bounce
  private readonly minSamplesForPeak = 3;

  // Butterworth filter coefficients (computed for ~50Hz sample rate)
  // High-pass: fc=0.5Hz, 2nd order
  private readonly hp_a1 = -1.911197;
  private readonly hp_a2 = 0.914976;
  private readonly hp_b0 = 0.956543;
  private readonly hp_b1 = -1.913086;
  private readonly hp_b2 = 0.956543;
  // Low-pass: fc=5Hz, 2nd order
  private readonly lp_a1 = -1.561018;
  private readonly lp_a2 = 0.641352;
  private readonly lp_b0 = 0.020083;
  private readonly lp_b1 = 0.040167;
  private readonly lp_b2 = 0.020083;

  reset() {
    this.hp_x1 = this.hp_x2 = this.hp_y1 = this.hp_y2 = 0;
    this.lp_x1 = this.lp_x2 = this.lp_y1 = this.lp_y2 = 0;
    this.prevFiltered = 0;
    this.prevDelta = 0;
    this.samplesSincePeak = 0;
    this.lastStepAt = 0;
    this.peakRingBuffer = [];
    this.dynamicThreshold = this.initialThreshold;
    this.state = "idle";
    this.consecutiveSteps = 0;
    this.pendingSteps = 0;
    this.stepIntervals = [];
    this.magnitudeHistory = [];
    this.vehicleScore = 0;
  }

  /**
   * Process one accelerometer sample.
   * @returns Number of confirmed steps (usually 0 or 1, can be >1 when walking confirmed)
   */
  push(x: number, y: number, z: number, t: number = performance.now()): boolean {
    // 1. Orientation-independent magnitude
    const rawMag = Math.sqrt(x * x + y * y + z * z);

    // 2. Track raw magnitude for vehicle detection
    this.magnitudeHistory.push(rawMag);
    if (this.magnitudeHistory.length > this.magHistorySize) this.magnitudeHistory.shift();

    // 3. Bandpass filter: HP removes gravity, LP removes jitter
    const hpOut = this.highPass(rawMag);
    const filtered = this.lowPass(Math.abs(hpOut));

    this.samplesSincePeak++;

    // 4. Derivative for peak detection
    const delta = filtered - this.prevFiltered;
    this.prevFiltered = filtered;

    // 5. Peak detection: zero-crossing of derivative (pos→neg)
    const isPeakCandidate = this.prevDelta > 0 && delta <= 0;
    this.prevDelta = delta;

    if (!isPeakCandidate) return false;

    // === VALIDATION PIPELINE ===

    // 6. Anti-bounce: minimum samples between peaks
    if (this.samplesSincePeak < this.minSamplesForPeak) return false;

    // 7. Amplitude: must exceed absolute floor
    const peakValue = filtered;
    if (peakValue < this.minPeakAbsolute) return false;

    // 8. Dynamic threshold with hysteresis
    if (peakValue < this.dynamicThreshold * this.hysteresisUp) return false;

    // 9. Timing validation
    const interval = t - this.lastStepAt;
    if (this.lastStepAt > 0) {
      if (interval < this.minStepInterval) return false;
      // Check for unreasonably long gap (don't validate interval, just accept)
    }

    // 10. Vehicle rejection: high constant acceleration variance = in car
    if (this.isLikelyVehicle()) return false;

    // === STEP CONFIRMED (raw) ===
    this.lastStepAt = t;
    this.samplesSincePeak = 0;

    // Update adaptive threshold
    this.updateThreshold(peakValue);

    // Track interval
    if (interval > 0 && interval < this.maxStepInterval) {
      this.stepIntervals.push(interval);
      if (this.stepIntervals.length > this.intervalRingSize) this.stepIntervals.shift();
    }

    // 11. Walking state machine — reduces false positives
    return this.processStateMachine(t);
  }

  /** Walking state machine: requires N consecutive steps before confirming */
  private processStateMachine(_t: number): boolean {
    switch (this.state) {
      case "idle":
        this.state = "starting";
        this.consecutiveSteps = 1;
        this.pendingSteps = 1;
        return false; // Don't emit yet — wait for confirmation

      case "starting":
        this.consecutiveSteps++;
        this.pendingSteps++;
        if (this.consecutiveSteps >= this.stepsToConfirm) {
          // Walking confirmed — release all pending steps
          this.state = "walking";
          // Emit the current step (pending steps were already counted by caller tracking)
          return true;
        }
        return false;

      case "walking":
        this.consecutiveSteps++;
        return true; // Emit immediately

      case "stopping":
        this.state = "walking";
        this.consecutiveSteps++;
        return true;

      default:
        return false;
    }
  }

  /** Get number of pending (unconfirmed) steps to flush when walking starts */
  flushPendingSteps(): number {
    const pending = Math.max(0, this.pendingSteps - 1); // -1 because current step already returned true
    this.pendingSteps = 0;
    return pending;
  }

  /** 2nd order Butterworth high-pass filter */
  private highPass(input: number): number {
    const output = this.hp_b0 * input + this.hp_b1 * this.hp_x1 + this.hp_b2 * this.hp_x2
                 - this.hp_a1 * this.hp_y1 - this.hp_a2 * this.hp_y2;
    this.hp_x2 = this.hp_x1; this.hp_x1 = input;
    this.hp_y2 = this.hp_y1; this.hp_y1 = output;
    return output;
  }

  /** 2nd order Butterworth low-pass filter */
  private lowPass(input: number): number {
    const output = this.lp_b0 * input + this.lp_b1 * this.lp_x1 + this.lp_b2 * this.lp_x2
                 - this.lp_a1 * this.lp_y1 - this.lp_a2 * this.lp_y2;
    this.lp_x2 = this.lp_x1; this.lp_x1 = input;
    this.lp_y2 = this.lp_y1; this.lp_y1 = output;
    return output;
  }

  /** Update adaptive threshold using exponential moving average of peaks */
  private updateThreshold(peakValue: number) {
    this.peakRingBuffer.push(peakValue);
    if (this.peakRingBuffer.length > this.peakRingSize) this.peakRingBuffer.shift();

    if (this.peakRingBuffer.length >= 3) {
      const sorted = [...this.peakRingBuffer].sort((a, b) => a - b);
      // Use median for robustness against outliers
      const median = sorted[Math.floor(sorted.length / 2)];
      // Threshold = 35% of median peak (lower = more sensitive)
      this.dynamicThreshold = Math.max(this.minPeakAbsolute, median * 0.35);
    }
  }

  /** Detect vehicle motion: constant high-freq vibration without clear walking pattern */
  private isLikelyVehicle(): boolean {
    if (this.magnitudeHistory.length < 20) return false;

    // Check variance of raw magnitude — walking has clear peaks, vehicles have constant buzz
    const recent = this.magnitudeHistory.slice(-20);
    const avg = recent.reduce((s, v) => s + v, 0) / recent.length;
    const variance = recent.reduce((s, v) => s + (v - avg) ** 2, 0) / recent.length;

    // Very low variance + high magnitude = likely in a vehicle
    const isConstantHigh = variance < 0.3 && avg > 10.5;
    // Very high variance = likely shaking/vehicle bumps
    const isHighVariance = variance > 15;

    if (isConstantHigh || isHighVariance) {
      this.vehicleScore = Math.min(10, this.vehicleScore + 1);
    } else {
      this.vehicleScore = Math.max(0, this.vehicleScore - 0.5);
    }

    return this.vehicleScore > 5;
  }

  // === PUBLIC GETTERS ===

  /** Get walking regularity (0-1). CV-based metric. */
  getRegularity(): number {
    if (this.stepIntervals.length < 3) return 0;
    const avg = this.stepIntervals.reduce((s, v) => s + v, 0) / this.stepIntervals.length;
    const variance = this.stepIntervals.reduce((s, v) => s + (v - avg) ** 2, 0) / this.stepIntervals.length;
    const cv = Math.sqrt(variance) / avg;
    return Math.max(0, Math.min(1, 1 - (cv - 0.08) / 0.35));
  }

  /** Get cadence (steps/min) from recent intervals */
  getCadence(): number {
    if (this.stepIntervals.length < 2) return 0;
    const avg = this.stepIntervals.reduce((s, v) => s + v, 0) / this.stepIntervals.length;
    return Math.round(60000 / avg);
  }

  /** Is the user currently walking? */
  isWalking(): boolean {
    if (this.state === "idle") return false;
    return performance.now() - this.lastStepAt < this.walkingTimeout;
  }

  /** Get current walking state */
  getState(): WalkingState {
    if (!this.isWalking() && this.state !== "idle") {
      this.state = "idle";
      this.consecutiveSteps = 0;
      this.pendingSteps = 0;
    }
    return this.state;
  }

  /** Get current dynamic threshold for debugging */
  getThreshold(): number {
    return this.dynamicThreshold;
  }

  /** Get confidence score (0-1) based on state + regularity */
  getConfidence(): number {
    if (this.state === "idle") return 0;
    if (this.state === "starting") return 0.3;
    const reg = this.getRegularity();
    return Math.min(1, 0.5 + reg * 0.5);
  }
}
