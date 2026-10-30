// Original, deterministic instrumental. No sampled or third-party recordings.
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const rate = 22050;
const bpm = 112;
const beat = 60 / bpm;
const bars = 32;
const length = bars * 4 * beat;
const samples = new Float32Array(Math.ceil(length * rate));
const tau = Math.PI * 2;
let seed = 17112025;
const noise = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 2147483648 - 1; };
const frequency = (midi) => 440 * 2 ** ((midi - 69) / 12);

function sound(time, duration, synth, gain = 1) {
  const start = Math.round(time * rate);
  const end = Math.min(samples.length, start + Math.round(duration * rate));
  for (let i = Math.max(0, start); i < end; i++) {
    const t = (i - start) / rate;
    samples[i] += gain * synth(t, i - start);
  }
}

function keys(time, midi, duration, gain) {
  const f = frequency(midi);
  sound(time, duration, (t) => {
    const envelope = Math.min(1, t / .008) * Math.exp(-t * 3.4) * Math.min(1, (duration - t) / .07);
    const body = Math.sin(tau * f * t) + .25 * Math.sin(tau * f * 2.005 * t) + .09 * Math.sin(tau * f * 3 * t);
    return body * envelope;
  }, gain);
  // Two quiet rhythmic echoes give the instrumental a spacious, nostalgic feel.
  for (const [delay, level] of [[beat * .75, .20], [beat * 1.5, .08]]) {
    sound(time + delay, duration, (t) => Math.sin(tau * f * t) * Math.exp(-t * 4.4) * Math.min(1, t / .01), gain * level);
  }
}

const chords = [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 67]];
const bass = [36, 33, 29, 31];
const melody = [[76, 79, 83, 79, 76, 74], [76, 72, 79, 76, 72, 71], [72, 76, 81, 79, 76, 72], [74, 79, 83, 81, 79, 74]];

for (let bar = 0; bar < bars; bar++) {
  const at = bar * beat * 4;
  const progression = Math.floor(bar / 2) % 4;
  const chord = chords[progression];
  const section = Math.floor(bar / 8);

  for (const hit of [0, 1.75, 2.5, 3.5]) {
    chord.forEach((note, i) => keys(at + hit * beat + i * .008, note + (section === 2 ? 12 : 0), beat * 1.1, .052));
  }

  for (const position of [0, 1.5, 2.75, 3.5]) {
    const f = frequency(bass[progression] + (position === 3.5 ? 12 : 0));
    sound(at + position * beat, .29, (t) => (Math.sin(tau * f * t) + .18 * Math.sin(tau * f * 2 * t)) * Math.min(1, t / .008) * Math.exp(-t * 9), .21);
  }

  const kicks = bar % 2 ? [0, 1.75, 2.5] : [0, 1.5, 2.75];
  for (const position of kicks) sound(at + position * beat, .28, (t) => Math.sin(tau * (48 * t + 65 * .022 * (1 - Math.exp(-t / .022)))) * Math.exp(-t * 19), .46);
  for (const position of [1, 3]) {
    sound(at + position * beat, .16, (t) => (noise() * .7 + Math.sin(tau * 185 * t) * .3) * Math.exp(-t * 34), .22);
    for (let clap = 0; clap < 3; clap++) sound(at + position * beat + clap * .009, .06, (t) => noise() * Math.exp(-t * 65), .055);
  }
  for (let hit = 0; hit < 8; hit++) {
    const swing = hit % 2 ? .028 : 0;
    sound(at + hit * .5 * beat + swing, hit % 2 ? .085 : .038, (t) => noise() * Math.exp(-t * (hit % 2 ? 66 : 120)), hit % 2 ? .055 : .042);
  }

  const motif = melody[progression];
  const positions = bar % 2 ? [.5, 1.25, 2, 2.75, 3.25, 3.75] : [0, .75, 1.5, 2.25, 3, 3.5];
  if (section !== 1 || bar % 2) positions.forEach((position, i) => keys(at + position * beat, motif[i], .45, .055));

  // A soft pad, faded on both ends, sits behind the syncopated keys.
  chord.forEach((note) => {
    const f = frequency(note);
    sound(at, beat * 4, (t) => {
      const env = Math.min(1, t / .3) * Math.min(1, (beat * 4 - t) / .35);
      return (Math.sin(tau * f * .999 * t) + Math.sin(tau * f * 1.001 * t)) * env;
    }, .012);
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
  const edge = Math.min(1, i / 220, (samples.length - i) / 220);
  wav.writeInt16LE(Math.round(Math.tanh(samples[i] / peak * 1.15) * .83 * 32767 * edge), 44 + i * 2);
}
const directory = fileURLToPath(new URL("../public/audio/", import.meta.url));
mkdirSync(directory, { recursive: true });
writeFileSync(`${directory}/our-little-orbit.wav`, wav);
console.log(`Created Our Little Orbit: ${length.toFixed(2)}s, ${bpm} BPM, ${(wav.length / 1024 / 1024).toFixed(2)} MB.`);
