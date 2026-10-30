// Thirteen deterministic, original instrumental loops. No samples or third-party songs.
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const directory = fileURLToPath(new URL("../public/audio/sample/", import.meta.url));
mkdirSync(directory, { recursive: true });
const rate = 22050;
const tau = Math.PI * 2;
const tempos = [94, 122, 100, 114, 82, 98, 108, 130, 92, 118, 86, 126, 88];
const roots = [60, 62, 65, 57, 67, 59, 64, 60, 69, 62, 65, 67, 60];
const progressions = [[0, 9, 5, 7], [0, 5, 9, 7], [5, 0, 7, 9], [0, 7, 9, 5]];
const scale = [0, 2, 4, 7, 9, 12, 14, 16];

for (let track = 0; track < 13; track++) {
  const bpm = tempos[track];
  const beat = 60 / bpm;
  const duration = 8 * 4 * beat;
  const samples = new Float32Array(Math.ceil(duration * rate));
  let seed = 1717 + track * 1987;
  const noise = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 2147483648 - 1; };
  const frequency = (midi) => 440 * 2 ** ((midi - 69) / 12);
  const add = (at, length, wave, gain) => {
    const start = Math.round(at * rate);
    const end = Math.min(samples.length, start + Math.round(length * rate));
    for (let i = Math.max(0, start); i < end; i++) samples[i] += wave((i - start) / rate) * gain;
  };
  const note = (at, midi, length, gain, voice = 0) => {
    const f = frequency(midi);
    add(at, length, (t) => {
      const env = Math.min(1, t / .009) * Math.exp(-t * (voice === 1 ? 5 : 3)) * Math.min(1, (length - t) / .08);
      return (Math.sin(tau * f * t) + (voice === 1 ? .4 : .17) * Math.sin(tau * f * 2.003 * t) + .07 * Math.sin(tau * f * 3 * t)) * env;
    }, gain);
  };
  for (let bar = 0; bar < 8; bar++) {
    const at = bar * beat * 4;
    const offset = progressions[track % 4][bar % 4];
    const root = roots[track] + offset;
    for (const hit of [0, 1.5, 2.75]) [0, offset === 9 ? 3 : 4, 7, 11].forEach((interval, n) => note(at + hit * beat + n * .014, root + interval, beat * 1.3, .06, track % 3));
    for (const hit of [0, 1.5, 2, 3.5]) {
      const f = frequency(root - 24);
      add(at + hit * beat, beat * .7, (t) => Math.sin(tau * f * t) * Math.min(1, t / .01) * Math.exp(-t * 9), .2);
    }
    for (const hit of [0, 2, ...(track % 2 ? [2.75] : [])]) add(at + hit * beat, .22, (t) => Math.sin(tau * (48 * t + 65 * .025 * (1 - Math.exp(-t / .025)))) * Math.exp(-t * 20), .32);
    for (const hit of [1, 3]) add(at + hit * beat, .14, (t) => (noise() * .8 + Math.sin(tau * 180 * t) * .2) * Math.exp(-t * 36), .12);
    for (let hit = 0; hit < 8; hit++) add(at + hit * beat / 2 + (hit % 2 ? .018 : 0), .045, (t) => noise() * Math.exp(-t * 100), .035);
    const positions = track % 2 ? [.5, 1.25, 2.5, 3.25] : [0, .75, 1.75, 3];
    positions.forEach((position, i) => {
      const midi = roots[track] + 12 + scale[(i * (track % 3 + 1) + bar + track) % scale.length];
      note(at + position * beat, midi, beat * 1.1, .065, (track + 1) % 3);
      note(at + (position + .75) * beat, midi, beat * .6, .012, 1);
    });
  }
  let peak = .001;
  for (const value of samples) peak = Math.max(peak, Math.abs(value));
  const wav = Buffer.alloc(44 + samples.length * 2);
  wav.write("RIFF", 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write("WAVEfmt ", 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(rate, 24); wav.writeUInt32LE(rate * 2, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
  wav.write("data", 36); wav.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) {
    const fade = Math.min(1, i / (rate * .03), (samples.length - i) / (rate * .22));
    wav.writeInt16LE(Math.round(Math.tanh(samples[i] / peak * 1.05) * .72 * 32767 * fade), 44 + i * 2);
  }
  const name = `track-${String(track + 1).padStart(2, "0")}.wav`;
  writeFileSync(`${directory}${name}`, wav);
  console.log(`${name}: ${bpm} BPM, ${duration.toFixed(2)} seconds`);
}
