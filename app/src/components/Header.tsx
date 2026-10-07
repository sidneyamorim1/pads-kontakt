import React from 'react';
import { Radio, Disc3, Volume2, Speaker } from 'lucide-react';
import { SoundKit } from '../data/soundKits';

interface HeaderProps {
  soundKits: SoundKit[];
  activeKitId: string;
  onSelectKit: (id: string) => void;
  midiConnected: boolean;
  midiDeviceName: string | null;
  onRequestMidiAccess: () => void;
  masterVolume: number;
  onSetMasterVolume: (volume: number) => void;
  outputLabel: string;
  onOpenOutput: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  soundKits,
  activeKitId,
  onSelectKit,
  midiConnected,
  midiDeviceName,
  onRequestMidiAccess,
  masterVolume,
  onSetMasterVolume,
  outputLabel,
  onOpenOutput
}) => {
  return (
    <header className="w-full glass-panel border-b border-white/10 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-40"
      // padding inline: o reset `* { padding: 0 }` do index.css anula as classes px/py do Tailwind
      style={{ padding: '10px 24px' }}
    >
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
          <Disc3 className="w-6 h-6 text-black animate-spin-slow" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Sampler <span className="text-amber-500">Studio</span>
          </h1>
          <p className="text-xs text-gray-400 font-mono">
            12 pads · 9 áudios · MIDI
          </p>
        </div>
      </div>

      {/* Preset Selector & MIDI Status */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Kit Dropdown */}
        <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm">
          <Volume2 className="w-4 h-4 text-amber-500" />
          <span className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Kit:</span>
          <select
            value={activeKitId}
            onChange={(e) => onSelectKit(e.target.value)}
            className="bg-transparent text-white focus:outline-none cursor-pointer font-medium text-sm"
          >
            {soundKits.map((kit) => (
              <option key={kit.id} value={kit.id} className="bg-gray-900 text-white">
                {kit.name}
              </option>
            ))}
          </select>
        </div>

        {/* MIDI Connection Status / Scan Button */}
        <button
          type="button"
          onClick={onRequestMidiAccess}
          title="Clique para Conectar / Escanear Dispositivos MIDI"
          className={`flex items-center gap-2 border rounded-lg px-3 py-1.5 text-xs font-mono transition-all cursor-pointer active:scale-95 ${
            midiConnected 
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/50' 
              : 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-900/50'
          }`}
        >
          <Radio className={`w-3.5 h-3.5 ${midiConnected ? 'text-emerald-400 animate-pulse' : 'text-amber-400 animate-bounce'}`} />
          <span>
            {midiConnected 
              ? `MIDI: ${midiDeviceName || 'Conectado'}` 
              : 'Clique para Conectar MIDI'}
          </span>
        </button>

        {/* Saída de áudio (placa / canais) */}
        <button
          type="button"
          onClick={onOpenOutput}
          title="Escolher placa de som e canais de saída"
          className="flex items-center gap-2 bg-black/40 border border-white/10 hover:border-amber-500/50 rounded-lg px-3 py-1.5 text-xs font-mono text-gray-200 transition-all cursor-pointer active:scale-95 max-w-[14rem]"
        >
          <Speaker className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="truncate">{outputLabel}</span>
        </button>

        {/* Volume geral */}
        <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5" title="Volume geral">
          <Volume2 className="w-4 h-4 text-amber-500" />
          <input
            type="range" min={0} max={100} value={masterVolume}
            onChange={(e) => onSetMasterVolume(Number(e.target.value))}
            className="w-28"
          />
          <span className="text-xs text-gray-300 font-mono w-9 text-right">{masterVolume}%</span>
        </div>
      </div>

    </header>
  );
};
