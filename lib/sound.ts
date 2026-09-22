"use client";

import { readPrefs } from "@/lib/prefs";
import { prefersReducedMotion } from "@/lib/motion";

let ctx: AudioContext | null = null;

function context() {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx ??= new AC();
  return ctx;
}

function beep(freq: number, duration: number, type: OscillatorType = "sine", gain = 0.04) {
  if (!readPrefs().sounds || prefersReducedMotion()) return;
  const audio = context();
  if (!audio) return;
  void audio.resume();
  const osc = audio.createOscillator();
  const amp = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  amp.gain.value = gain;
  amp.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);
  osc.connect(amp);
  amp.connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + duration);
}

export function playTap() {
  beep(520, 0.07, "triangle", 0.03);
}

export function playSuccess() {
  beep(523, 0.08, "triangle", 0.04);
  setTimeout(() => beep(659, 0.1, "triangle", 0.04), 70);
  setTimeout(() => beep(784, 0.14, "triangle", 0.035), 140);
}

export function playUnlock() {
  beep(392, 0.08, "square", 0.025);
  setTimeout(() => beep(523, 0.12, "square", 0.025), 80);
}
