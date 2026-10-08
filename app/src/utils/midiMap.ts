import { PadData } from './audioEngine';

// Mapeamento MIDI aprendido (MIDI Learn): qual nota ou CC dispara cada pad.
// Fica salvo neste computador (localStorage), separado dos presets: o controlador é o mesmo em qualquer preset.
// Pad sem mapeamento salvo usa a nota padrão dele (36 a 56).

export interface MidiBinding {
  type: 'note' | 'cc';
  num: number; // 0 a 127
}

export type MidiMap = Record<number, MidiBinding>;

const STORAGE_KEY = 'sampler-studio-midi-map';

export function loadMidiMap(): MidiMap {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {};
  } catch {
    return {};
  }
}

export function saveMidiMap(map: MidiMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function bindingFor(pad: PadData, map: MidiMap): MidiBinding {
  return map[pad.id] ?? { type: pad.midiType ?? 'note', num: pad.midiNote };
}

export const sameBinding = (a: MidiBinding, b: MidiBinding) => a.type === b.type && a.num === b.num;

// Mesma convenção do controlador: nota 36 = C1
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export function bindingLabel(b: MidiBinding): string {
  if (b.type === 'cc') return `CC ${b.num}`;
  return `${NOTE_NAMES[b.num % 12]}${Math.floor(b.num / 12) - 2} · ${b.num}`;
}
