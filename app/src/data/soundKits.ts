import { PadData } from '../utils/audioEngine';

export interface SoundKit {
  id: string;
  name: string;
  description: string;
  pads: PadData[];
}

// 6 cards laterais (ids 13 a 18): tocam o áudio inteiro e reiniciam ao clicar de novo.
// Sem sample carregado, usam o som sintetizado da categoria.
const SIDE_PAD_DEFAULTS: Pick<PadData, 'name' | 'category' | 'pitch'>[] = [
  { name: 'Áudio 1', category: 'synth', pitch: 0 },
  { name: 'Áudio 2', category: 'synth', pitch: 3 },
  { name: 'Áudio 3', category: 'synth', pitch: 5 },
  { name: 'Áudio 4', category: 'synth', pitch: 7 },
  { name: 'Áudio 5', category: 'fx', pitch: 0 },
  { name: 'Áudio 6', category: 'fx', pitch: 5 },
];
const SIDE_PAD_KEYS = ['t', 'y', 'g', 'h', 'b', 'n'];
const SIDE_PAD_COLORS = ['#e879f9', '#c084fc', '#f472b6', '#a78bfa', '#fb7185', '#d946ef'];

export const SIDE_PADS: PadData[] = SIDE_PAD_DEFAULTS.map((d, i) => ({
  ...d,
  id: 13 + i,
  midiNote: 48 + i, // C2 a F2
  keyTrigger: SIDE_PAD_KEYS[i],
  volume: 85,
  pan: 0,
  attack: 0.005,
  release: 0.4,
  reverbSend: 0,
  reverse: false,
  color: SIDE_PAD_COLORS[i],
  playToEnd: true,
}));

// Sessões e presets salvos antes dos cards laterais só têm 12 pads: completa com os 6 padrão
export function withSidePads(pads: PadData[]): PadData[] {
  const missing = SIDE_PADS.filter(sp => !pads.some(p => p.id === sp.id));
  return [...pads, ...missing];
}

export const SOUND_KITS: SoundKit[] = [
  {
    id: 'trap-808',
    name: '808 Trap & Hip-Hop (12 Pads)',
    description: 'Kit de bateria de 12 pads com 808 Sub, Snares, Hats, Claps e FXs.',
    pads: [
      { id: 1, name: '808 Sub Kick', category: 'kick', midiNote: 36, keyTrigger: '1', volume: 90, pitch: 0, pan: 0, attack: 0.005, release: 0.4, reverbSend: 0, reverse: false, color: '#ff5500' },
      { id: 2, name: 'Trap Snare', category: 'snare', midiNote: 37, keyTrigger: '2', volume: 85, pitch: 0, pan: 0, attack: 0.005, release: 0.2, reverbSend: 15, reverse: false, color: '#00f0ff' },
      { id: 3, name: 'Hi-Hat Closed', category: 'hihat', midiNote: 38, keyTrigger: '3', volume: 75, pitch: 0, pan: -20, attack: 0.002, release: 0.08, reverbSend: 5, reverse: false, color: '#00ff66' },
      { id: 4, name: 'Hi-Hat Open', category: 'hihat', midiNote: 39, keyTrigger: '4', volume: 75, pitch: 0, pan: 20, attack: 0.002, release: 0.3, reverbSend: 10, reverse: false, color: '#ffdd00' },
      { id: 5, name: 'Clap / Rim', category: 'perc', midiNote: 40, keyTrigger: '5', volume: 80, pitch: 0, pan: 0, attack: 0.005, release: 0.15, reverbSend: 20, reverse: false, color: '#ff3366' },
      { id: 6, name: 'Perc Bell', category: 'perc', midiNote: 41, keyTrigger: '6', volume: 70, pitch: 2, pan: 30, attack: 0.005, release: 0.25, reverbSend: 25, reverse: false, color: '#9933ff' },
      { id: 7, name: 'Synth Stab', category: 'synth', midiNote: 42, keyTrigger: '7', volume: 85, pitch: 0, pan: 0, attack: 0.01, release: 0.35, reverbSend: 30, reverse: false, color: '#00ccff' },
      { id: 8, name: 'Vox Chant FX', category: 'fx', midiNote: 43, keyTrigger: '8', volume: 80, pitch: -2, pan: 0, attack: 0.01, release: 0.4, reverbSend: 40, reverse: false, color: '#ff9900' },
      // 4 New Pads (Pads 9-12)
      { id: 9, name: 'Crash Cymbal', category: 'hihat', midiNote: 44, keyTrigger: '9', volume: 80, pitch: 0, pan: -30, attack: 0.002, release: 0.6, reverbSend: 35, reverse: false, color: '#ffcc00' },
      { id: 10, name: 'Sub Bass Drop', category: 'kick', midiNote: 45, keyTrigger: '0', volume: 95, pitch: -5, pan: 0, attack: 0.01, release: 0.8, reverbSend: 10, reverse: false, color: '#ff2200' },
      { id: 11, name: 'Synth Lead Pluck', category: 'synth', midiNote: 46, keyTrigger: '-', volume: 80, pitch: 4, pan: 15, attack: 0.005, release: 0.3, reverbSend: 40, reverse: false, color: '#aa00ff' },
      { id: 12, name: 'Riser FX', category: 'fx', midiNote: 47, keyTrigger: '=', volume: 75, pitch: 0, pan: 0, attack: 0.05, release: 0.7, reverbSend: 50, reverse: true, color: '#00ffaa' },
      ...SIDE_PADS
    ]
  },
  {
    id: 'lofi-beats',
    name: 'Lo-Fi Organic Beats (12 Pads)',
    description: 'Sons organicos de bateria, vinil e percussao vintage em 12 pads.',
    pads: [
      { id: 1, name: 'Warm Lo-Fi Kick', category: 'kick', midiNote: 36, keyTrigger: '1', volume: 85, pitch: -2, pan: 0, attack: 0.01, release: 0.3, reverbSend: 10, reverse: false, color: '#ff7733' },
      { id: 2, name: 'Vintage Snare', category: 'snare', midiNote: 37, keyTrigger: '2', volume: 80, pitch: -1, pan: 0, attack: 0.005, release: 0.18, reverbSend: 25, reverse: false, color: '#33ccff' },
      { id: 3, name: 'Paper Shaker', category: 'hihat', midiNote: 38, keyTrigger: '3', volume: 70, pitch: 1, pan: -25, attack: 0.005, release: 0.1, reverbSend: 15, reverse: false, color: '#33ff99' },
      { id: 4, name: 'Soft Ride', category: 'hihat', midiNote: 39, keyTrigger: '4', volume: 70, pitch: 0, pan: 25, attack: 0.005, release: 0.35, reverbSend: 20, reverse: false, color: '#ffee44' },
      { id: 5, name: 'Woodblock Perc', category: 'perc', midiNote: 40, keyTrigger: '5', volume: 75, pitch: 3, pan: 10, attack: 0.002, release: 0.12, reverbSend: 15, reverse: false, color: '#ff5599' },
      { id: 6, name: 'Vinyl Chime', category: 'perc', midiNote: 41, keyTrigger: '6', volume: 65, pitch: 5, pan: -15, attack: 0.01, release: 0.5, reverbSend: 35, reverse: false, color: '#b366ff' },
      { id: 7, name: 'Rhodes Chord', category: 'synth', midiNote: 42, keyTrigger: '7', volume: 80, pitch: 0, pan: 0, attack: 0.02, release: 0.5, reverbSend: 45, reverse: false, color: '#00e5ff' },
      { id: 8, name: 'Reverse FX', category: 'fx', midiNote: 43, keyTrigger: '8', volume: 75, pitch: 0, pan: 0, attack: 0.05, release: 0.4, reverbSend: 50, reverse: true, color: '#ffaa00' },
      // 4 New Pads
      { id: 9, name: 'Vinyl Snap', category: 'perc', midiNote: 44, keyTrigger: '9', volume: 75, pitch: 2, pan: -10, attack: 0.002, release: 0.1, reverbSend: 15, reverse: false, color: '#ffaa55' },
      { id: 10, name: 'Organic Tom', category: 'kick', midiNote: 45, keyTrigger: '0', volume: 80, pitch: -3, pan: -20, attack: 0.01, release: 0.3, reverbSend: 20, reverse: false, color: '#ff4444' },
      { id: 11, name: 'Jazz Brush', category: 'snare', midiNote: 46, keyTrigger: '-', volume: 70, pitch: 0, pan: 15, attack: 0.01, release: 0.25, reverbSend: 30, reverse: false, color: '#55ccff' },
      { id: 12, name: 'LoFi Atmosphere', category: 'fx', midiNote: 47, keyTrigger: '=', volume: 65, pitch: 0, pan: 0, attack: 0.1, release: 0.9, reverbSend: 60, reverse: false, color: '#bb55ff' },
      ...SIDE_PADS
    ]
  }
];
