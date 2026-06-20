import { useCallback, useSyncExternalStore } from "react";

const SOUND_KEY = "kroki.sound";

let soundEnabled = typeof window !== "undefined"
  ? localStorage.getItem(SOUND_KEY) !== "off"
  : true;

let listeners: Array<() => void> = [];

function subscribe(cb: () => void) {
  listeners.push(cb);
  return () => { listeners = listeners.filter((l) => l !== cb); };
}

function getSnapshot() {
  return soundEnabled;
}

function emit() {
  listeners.forEach((l) => l());
}

// AudioContext singleton
let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioCtx;
}

function playTone(frequency: number, duration: number, volume = 0.15) {
  const ctx = getAudioCtx();
  if (!ctx || !soundEnabled) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = frequency;
  osc.type = "sine";
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

export function useSound() {
  const enabled = useSyncExternalStore(subscribe, getSnapshot, () => true);

  const toggle = useCallback(() => {
    soundEnabled = !soundEnabled;
    localStorage.setItem(SOUND_KEY, soundEnabled ? "on" : "off");
    emit();
  }, []);

  const playStep = useCallback(() => {
    if (!soundEnabled) return;
    playTone(880, 0.08, 0.08);
  }, []);

  const playMilestone = useCallback(() => {
    if (!soundEnabled) return;
    playTone(523, 0.15, 0.12);
    setTimeout(() => playTone(659, 0.15, 0.12), 100);
    setTimeout(() => playTone(784, 0.2, 0.15), 200);
  }, []);

  const playGoal = useCallback(() => {
    if (!soundEnabled) return;
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.25, 0.15), i * 120);
    });
  }, []);

  return { enabled, toggle, playStep, playMilestone, playGoal };
}
