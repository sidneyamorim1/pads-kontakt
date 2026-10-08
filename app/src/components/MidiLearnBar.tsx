import React from 'react';
import { Radio, RotateCcw, Check } from 'lucide-react';
import { PadData } from '../utils/audioEngine';

interface MidiLearnBarProps {
  targetPad: PadData | null;
  lastMidiEvent: { type: 'note' | 'cc'; val: number; ch: number } | null;
  onReset: () => void;
  onDone: () => void;
}

// Barra do modo MIDI Learn: mostra qual pad está esperando um botão do controlador
export const MidiLearnBar: React.FC<MidiLearnBarProps> = ({ targetPad, lastMidiEvent, onReset, onDone }) => {
  const btn = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all active:scale-95 cursor-pointer';
  const target = targetPad && (targetPad.playToEnd ? `ÁUDIO ${targetPad.id - 12}` : `PAD ${targetPad.id}`);

  return (
    <div className="w-full flex flex-wrap items-center gap-3 rounded-xl border border-cyan-400/50 bg-cyan-950/40" style={{ padding: '8px 12px' }}>
      <Radio className="w-4 h-4 text-cyan-300 animate-pulse" />
      <span className="text-cyan-100 text-xs font-bold uppercase tracking-wider">MIDI Learn</span>
      <span className="text-sm text-gray-200">
        {target
          ? <>Aperte no controlador o botão para o <strong className="text-cyan-300">{target}</strong> ({targetPad!.name}).</>
          : 'Clique no pad ou card que quer configurar.'}
      </span>
      {lastMidiEvent && (
        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 rounded" style={{ padding: '2px 6px' }}>
          Último sinal: {lastMidiEvent.type === 'cc' ? 'CC' : 'Nota'} {lastMidiEvent.val} · canal {lastMidiEvent.ch}
        </span>
      )}
      <div className="flex items-center gap-2 ml-auto">
        <button
          type="button"
          onClick={() => window.confirm('Voltar todos os pads e cards para as notas padrão (36 a 56)?') && onReset()}
          className={`${btn} bg-gray-800 border-white/10 text-gray-200 hover:bg-gray-700`}
        >
          <RotateCcw className="w-3.5 h-3.5" /> Restaurar padrão
        </button>
        <button type="button" onClick={onDone} className={`${btn} bg-cyan-500/20 border-cyan-400/50 text-cyan-200 hover:bg-cyan-500/30`}>
          <Check className="w-3.5 h-3.5" /> Concluir
        </button>
      </div>
    </div>
  );
};
