import React from 'react';
import { Sliders, Code2, HelpCircle, Radio, Disc3, Volume2, FolderDown } from 'lucide-react';
import { SoundKit } from '../data/soundKits';

interface HeaderProps {
  soundKits: SoundKit[];
  activeKitId: string;
  onSelectKit: (id: string) => void;
  midiConnected: boolean;
  midiDeviceName: string | null;
  onRequestMidiAccess: () => void;
  onOpenKspModal: () => void;
  onOpenTutorialModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  soundKits,
  activeKitId,
  onSelectKit,
  midiConnected,
  midiDeviceName,
  onRequestMidiAccess,
  onOpenKspModal,
  onOpenTutorialModal
}) => {
  return (
    <header className="w-full glass-panel border-b border-white/10 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-40">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
          <Disc3 className="w-6 h-6 text-black animate-spin-slow" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Kontakt <span className="text-amber-500">8-Pad</span> Sampler Studio
          </h1>
          <p className="text-xs text-gray-400 font-mono">
            Controlador VST & Gerador KSP para Kontakt
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
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <a
          href="./Kontakt_8Pad_Library_Package.zip"
          download="Kontakt_8Pad_Library_Package.zip"
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-bold px-4 py-2 rounded-lg text-sm transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer"
        >
          <FolderDown className="w-4 h-4" />
          <span>Baixar Pacote Kontakt (.zip)</span>
        </a>

        <button
          onClick={onOpenKspModal}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-semibold px-4 py-2 rounded-lg text-sm transition-all shadow-md shadow-orange-500/20 active:scale-95 cursor-pointer"
        >
          <Code2 className="w-4 h-4" />
          <span>Gerar Script KSP</span>
        </button>

        <button
          onClick={onOpenTutorialModal}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-white/10 px-3.5 py-2 rounded-lg text-sm transition-all active:scale-95 cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 text-cyan-400" />
          <span className="hidden sm:inline">Guia Kontakt</span>
        </button>
      </div>
    </header>
  );
};
