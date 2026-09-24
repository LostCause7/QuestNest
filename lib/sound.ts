"use client";

import { readPrefs } from "@/lib/prefs";
import { prefersReducedMotion } from "@/lib/motion";
import { DEFAULT_SOUND_PACK } from "@/lib/cosmetics";

/**
 * Tiny Web Audio synth. No samples, no vendors: every sound is a "recipe" of
 * short notes. Packs change the voice (waveform, envelope, pitch shift) while
 * events keep the same melodic shape so kids learn what each sound means.
 */

export type SoundEvent =
  | "tap"
  | "pinDigit"
  | "pinUnlock"
  | "pinError"
  | "questDone"
  | "approved"
  | "badge"
  | "milestone"
  | "levelUp"
  | "purchase"
  | "streak"
  | "error"
  | "stamp"
  | "combo"
  | "sunrise"
  | "comeback"
  | "kudos";

export type SoundPack = "classic" | "chiptune" | "marimba" | "space" | "animal" | "drums";

type Note = { f: number; t: number; d: number; g?: number; type?: OscillatorType; slide?: number; noise?: boolean };

type Voice = {
  type: OscillatorType;
  gain: number;
  attack: number;
  release: number;
  pitch: number; // multiplier
  detune?: number; // cents
  noise?: boolean; // percussive click layer
  wobble?: number; // vibrato depth in Hz
};

const VOICES: Record<SoundPack, Voice> = {
  classic: { type: "triangle", gain: 0.04, attack: 0.005, release: 0.9, pitch: 1 },
  chiptune: { type: "square", gain: 0.022, attack: 0.001, release: 0.5, pitch: 1 },
  marimba: { type: "sine", gain: 0.06, attack: 0.002, release: 1.6, pitch: 1, noise: true },
  space: { type: "sawtooth", gain: 0.02, attack: 0.03, release: 1.4, pitch: 0.5, detune: 8, wobble: 6 },
  animal: { type: "triangle", gain: 0.045, attack: 0.01, release: 0.8, pitch: 1.5, wobble: 18 },
  drums: { type: "sine", gain: 0.07, attack: 0.001, release: 0.4, pitch: 0.25, noise: true },
};

// Pitches (Hz) — C major pentatonic keeps everything friendly.
const C4 = 261.63, D4 = 293.66, E4 = 329.63, G4 = 392.0, A4 = 440.0;
const C5 = 523.25, D5 = 587.33, E5 = 659.25, G5 = 783.99, A5 = 880.0, C6 = 1046.5, E6 = 1318.5;

const RECIPES: Record<SoundEvent, Note[]> = {
  tap: [{ f: C5, t: 0, d: 0.07, g: 0.7 }],
  pinDigit: [{ f: E5, t: 0, d: 0.06, g: 0.6 }],
  pinUnlock: [
    { f: G4, t: 0, d: 0.09 },
    { f: C5, t: 0.08, d: 0.14 },
  ],
  pinError: [
    { f: E4, t: 0, d: 0.12, type: "square", g: 0.6 },
    { f: C4, t: 0.12, d: 0.18, type: "square", g: 0.6 },
  ],
  questDone: [
    { f: C5, t: 0, d: 0.08 },
    { f: E5, t: 0.07, d: 0.1 },
    { f: G5, t: 0.14, d: 0.16 },
  ],
  approved: [
    { f: E5, t: 0, d: 0.08 },
    { f: G5, t: 0.08, d: 0.08 },
    { f: C6, t: 0.16, d: 0.22 },
  ],
  badge: [
    { f: C5, t: 0, d: 0.1 },
    { f: E5, t: 0.09, d: 0.1 },
    { f: G5, t: 0.18, d: 0.1 },
    { f: C6, t: 0.27, d: 0.28 },
    { f: E6, t: 0.27, d: 0.28, g: 0.5 },
  ],
  milestone: [
    { f: G4, t: 0, d: 0.12 },
    { f: C5, t: 0.12, d: 0.12 },
    { f: E5, t: 0.24, d: 0.12 },
    { f: G5, t: 0.36, d: 0.3 },
    { f: C6, t: 0.5, d: 0.4 },
  ],
  levelUp: [
    { f: C5, t: 0, d: 0.09 },
    { f: D5, t: 0.08, d: 0.09 },
    { f: E5, t: 0.16, d: 0.09 },
    { f: G5, t: 0.24, d: 0.09 },
    { f: A5, t: 0.32, d: 0.09 },
    { f: C6, t: 0.4, d: 0.4 },
  ],
  purchase: [
    { f: A5, t: 0, d: 0.06, g: 0.8 },
    { f: E6, t: 0.06, d: 0.18, g: 0.7 },
  ],
  streak: [
    { f: E5, t: 0, d: 0.08 },
    { f: E5, t: 0.1, d: 0.08 },
    { f: G5, t: 0.2, d: 0.24 },
  ],
  error: [{ f: D4, t: 0, d: 0.16, type: "square", g: 0.6 }],
  stamp: [
    { f: A4, t: 0, d: 0.05, type: "square", g: 0.9, noise: true },
    { f: A5, t: 0.03, d: 0.1, g: 0.5 },
  ],
  combo: [
    { f: G5, t: 0, d: 0.06 },
    { f: A5, t: 0.05, d: 0.06 },
    { f: C6, t: 0.1, d: 0.06 },
    { f: E6, t: 0.15, d: 0.2 },
  ],
  sunrise: [
    { f: C4, t: 0, d: 0.3, g: 0.6 },
    { f: E4, t: 0.15, d: 0.3, g: 0.6 },
    { f: G4, t: 0.3, d: 0.3, g: 0.6 },
    { f: C5, t: 0.45, d: 0.5, g: 0.7 },
  ],
  comeback: [
    { f: G4, t: 0, d: 0.12 },
    { f: E4, t: 0.1, d: 0.12 },
    { f: G4, t: 0.2, d: 0.12 },
    { f: C5, t: 0.3, d: 0.36 },
  ],
  kudos: [
    { f: E5, t: 0, d: 0.1 },
    { f: G5, t: 0.09, d: 0.1 },
    { f: E5, t: 0.18, d: 0.18 },
  ],
};

let ctx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;

function context() {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx ??= new AC();
  return ctx;
}

function noise(audio: AudioContext) {
  if (!noiseBuffer) {
    noiseBuffer = audio.createBuffer(1, audio.sampleRate * 0.05, audio.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }
  return noiseBuffer;
}

export function currentPack(): SoundPack {
  if (typeof document === "undefined") return DEFAULT_SOUND_PACK as SoundPack;
  const p = document.documentElement.dataset.qnSoundPack as SoundPack | undefined;
  return p && p in VOICES ? p : (DEFAULT_SOUND_PACK as SoundPack);
}

export function setSoundPack(pack: string | null | undefined) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.qnSoundPack = pack && pack in VOICES ? pack : DEFAULT_SOUND_PACK;
}

function canPlay() {
  return readPrefs().sounds && !prefersReducedMotion();
}

function schedule(audio: AudioContext, voice: Voice, note: Note, at: number) {
  const start = at + note.t;
  const dur = note.d * (voice.release + 0.4);
  const osc = audio.createOscillator();
  const amp = audio.createGain();
  osc.type = note.type ?? voice.type;
  osc.frequency.setValueAtTime(note.f * voice.pitch, start);
  if (note.slide) osc.frequency.exponentialRampToValueAtTime(note.f * voice.pitch * note.slide, start + dur);
  if (voice.detune) osc.detune.value = voice.detune;
  if (voice.wobble) {
    const lfo = audio.createOscillator();
    const lfoGain = audio.createGain();
    lfo.frequency.value = voice.wobble;
    lfoGain.gain.value = note.f * voice.pitch * 0.01;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start(start);
    lfo.stop(start + dur);
  }
  const peak = voice.gain * (note.g ?? 1);
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(peak, start + voice.attack);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(amp);
  amp.connect(audio.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);

  if (voice.noise || note.noise) {
    const src = audio.createBufferSource();
    src.buffer = noise(audio);
    const nAmp = audio.createGain();
    nAmp.gain.setValueAtTime(peak * 0.6, start);
    nAmp.gain.exponentialRampToValueAtTime(0.0001, start + 0.05);
    src.connect(nAmp);
    nAmp.connect(audio.destination);
    src.start(start);
  }
}

/** Play a named sound in the kid's current pack. Safe to call anywhere; no-ops on the server or when muted. */
export function play(event: SoundEvent, pack: SoundPack = currentPack()) {
  if (!canPlay()) return;
  const audio = context();
  if (!audio) return;
  void audio.resume();
  const voice = VOICES[pack] ?? VOICES.classic;
  const now = audio.currentTime + 0.01;
  for (const note of RECIPES[event]) schedule(audio, voice, note, now);
}

/** Preview a pack regardless of the equipped one (used by the Closet). */
export function previewPack(pack: SoundPack) {
  play("questDone", pack);
}

// ---- Ambient hum (opt-in device pref) -------------------------------------
let ambient: { nodes: AudioNode[]; gain: GainNode } | null = null;

/** Very quiet two-note pad with a slow breath. Starts silent and fades in; safe to call repeatedly. */
export function startAmbient() {
  if (ambient || !readPrefs().sounds || !readPrefs().ambient) return;
  const audio = context();
  if (!audio) return;
  void audio.resume();
  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.0001, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.012, audio.currentTime + 4);
  const lfo = audio.createOscillator();
  const lfoGain = audio.createGain();
  lfo.frequency.value = 0.08;
  lfoGain.gain.value = 0.005;
  lfo.connect(lfoGain);
  lfoGain.connect(gain.gain);
  const nodes: AudioNode[] = [lfo];
  for (const f of [110, 164.81, 220]) {
    const osc = audio.createOscillator();
    osc.type = "sine";
    osc.frequency.value = f;
    osc.detune.value = f === 220 ? 4 : -3;
    osc.connect(gain);
    osc.start();
    nodes.push(osc);
  }
  lfo.start();
  gain.connect(audio.destination);
  ambient = { nodes, gain };
}

export function stopAmbient() {
  if (!ambient) return;
  const audio = context();
  const { nodes, gain } = ambient;
  ambient = null;
  if (!audio) return;
  gain.gain.cancelScheduledValues(audio.currentTime);
  gain.gain.setValueAtTime(gain.gain.value || 0.0001, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 1.2);
  setTimeout(() => {
    for (const n of nodes) {
      try {
        (n as OscillatorNode).stop?.();
      } catch {
        /* already stopped */
      }
      n.disconnect();
    }
    gain.disconnect();
  }, 1400);
}

// Back-compat aliases used by older components.
export const playTap = () => play("tap");
export const playSuccess = () => play("questDone");
export const playUnlock = () => play("pinUnlock");
