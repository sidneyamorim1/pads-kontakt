import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(__dirname, '../public/kontakt-library-package');

const samplesDir = path.join(outputDir, 'Samples');
const resourcesDir = path.join(outputDir, 'Resources/scripts');
fs.mkdirSync(samplesDir, { recursive: true });
fs.mkdirSync(resourcesDir, { recursive: true });

function createWavBuffer(samples, sampleRate = 44100) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = samples.length * (bitsPerSample / 8);
  const chunkSize = 36 + dataSize;

  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(chunkSize, 4);
  buffer.write('WAVE', 8);

  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    const val = s < 0 ? s * 0x8000 : s * 0x7FFF;
    buffer.writeInt16LE(Math.floor(val), 44 + i * 2);
  }

  return buffer;
}

const sampleRate = 44100;

// 12 Sample Waveforms
const generateSamples = (duration, fn) => {
  const arr = new Float32Array(Math.floor(sampleRate * duration));
  for (let i = 0; i < arr.length; i++) {
    arr[i] = fn(i / sampleRate, i);
  }
  return arr;
};

const wavMap = [
  { file: 'Pad_1_808_Kick.wav', data: generateSamples(0.35, (t) => Math.sin(2 * Math.PI * (140 * Math.exp(-t * 22) + 38) * t) * Math.exp(-t * 9)) },
  { file: 'Pad_2_Trap_Snare.wav', data: generateSamples(0.2, (t) => Math.sin(2 * Math.PI * (180 * Math.exp(-t * 20) + 90) * t) * Math.exp(-t * 15) * 0.4 + (Math.random() * 2 - 1) * Math.exp(-t * 12) * 0.6) },
  { file: 'Pad_3_HiHat_Closed.wav', data: generateSamples(0.08, (t) => (Math.random() * 2 - 1) * Math.exp(-t * 40) * 0.7) },
  { file: 'Pad_4_HiHat_Open.wav', data: generateSamples(0.3, (t) => (Math.random() * 2 - 1) * Math.exp(-t * 10) * 0.7) },
  { file: 'Pad_5_Clap.wav', data: generateSamples(0.18, (t) => (Math.random() * 2 - 1) * Math.exp(-t * 15) * ((t < 0.01 || (t > 0.02 && t < 0.03) || (t > 0.04 && t < 0.05)) ? 1.0 : 0.2) * 0.8) },
  { file: 'Pad_6_Perc_Bell.wav', data: generateSamples(0.25, (t) => Math.sin(2 * Math.PI * 650 * t) * Math.exp(-t * 14) * 0.7) },
  { file: 'Pad_7_Synth_Stab.wav', data: generateSamples(0.35, (t) => (2 * (t * 329.63 - Math.floor(0.5 + t * 329.63))) * Math.exp(-t * 8) * 0.6) },
  { file: 'Pad_8_Vox_Chant.wav', data: generateSamples(0.4, (t) => (Math.sin(2 * Math.PI * 220 * t) + 0.5 * Math.sin(2 * Math.PI * 440 * t)) * Math.exp(-t * 7) * 0.5) },
  { file: 'Pad_9_Crash_Cymbal.wav', data: generateSamples(0.6, (t) => (Math.random() * 2 - 1) * Math.exp(-t * 6) * 0.7) },
  { file: 'Pad_10_Sub_Bass_Drop.wav', data: generateSamples(0.7, (t) => Math.sin(2 * Math.PI * (90 * Math.exp(-t * 4) + 30) * t) * Math.exp(-t * 3) * 0.9) },
  { file: 'Pad_11_Synth_Lead.wav', data: generateSamples(0.3, (t) => Math.sin(2 * Math.PI * 523.25 * t) * Math.exp(-t * 9) * 0.7) },
  { file: 'Pad_12_Riser_FX.wav', data: generateSamples(0.8, (t) => (Math.random() * 2 - 1) * Math.exp(-(0.8 - t) * 5) * 0.6) },
];

wavMap.forEach((item) => {
  const buf = createWavBuffer(item.data);
  fs.writeFileSync(path.join(samplesDir, item.file), buf);
});

console.log("12 WAV Samples gerados com sucesso!");
