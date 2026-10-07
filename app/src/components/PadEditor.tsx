import React, { useRef } from 'react';
import { PadData } from '../utils/audioEngine';
import { Sliders, Upload, Play, Volume2, Music, Sparkles } from 'lucide-react';

interface PadEditorProps {
  pad: PadData;
  onUpdatePad: (updatedPad: PadData) => void;
  onTriggerPad: (pad: PadData) => void;
  onUploadSample: (padId: number, file: File) => void;
}

export const PadEditor: React.FC<PadEditorProps> = ({
  pad,
  onUpdatePad,
  onTriggerPad,
  onUploadSample
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadSample(pad.id, file);
    }
  };

  return (
    <div className="w-full glass-panel rounded-2xl p-5 border border-white/10 shadow-2xl flex flex-col gap-4">
      {/* Editor Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold font-mono text-sm">
            {pad.id}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white leading-tight">
              Inspetor — <span className="text-amber-400">{pad.name}</span>
            </h3>
            <p className="text-[10px] text-gray-400 font-mono">
              Atalho: [{pad.keyTrigger}] | {pad.category.toUpperCase()}
            </p>
          </div>
        </div>

        <button
          onClick={() => onTriggerPad(pad)}
          className="flex items-center gap-1 bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-3 py-1.5 rounded-lg text-xs transition-all active:scale-95 cursor-pointer shadow-md shadow-cyan-500/20"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Testar</span>
        </button>
      </div>

      {/* Upload File Bar */}
      <div className="bg-black/40 p-3 rounded-xl border border-white/5 flex items-center justify-between gap-2">
        <div className="truncate text-xs text-gray-300 font-mono">
          <span className="text-gray-400 block text-[10px]">Arquivo de Áudio:</span>
          <span className="text-emerald-400 truncate block font-semibold">
            {pad.customFileName ? pad.customFileName : 'Sintetizador WebAudio Interno'}
          </span>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 text-white font-medium px-2.5 py-1.5 rounded-lg text-xs border border-white/10 transition-all cursor-pointer whitespace-nowrap"
        >
          <Upload className="w-3.5 h-3.5 text-amber-400" />
          <span>Trocar Áudio</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.wav,.aif,.aiff,.flac,.mp3,.m4a,.ogg"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Editor Controls Sections */}
      <div className="flex flex-col gap-3.5">
        {/* Name Input */}
        <div>
          <label className="block text-[11px] text-gray-400 mb-1">Nome do Instrumento:</label>
          <input
            type="text"
            value={pad.name}
            onChange={(e) => onUpdatePad({ ...pad, name: e.target.value })}
            className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none font-semibold"
          />
        </div>

        {/* Volume */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">Volume:</span>
            <span className="text-amber-400 font-mono font-bold">{pad.volume}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={pad.volume}
            onChange={(e) => onUpdatePad({ ...pad, volume: parseInt(e.target.value) })}
          />
        </div>

        {/* Pitch */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">Afinação (Pitch):</span>
            <span className="text-cyan-400 font-mono font-bold">
              {pad.pitch > 0 ? `+${pad.pitch}` : pad.pitch} semitões
            </span>
          </div>
          <input
            type="range"
            min="-12"
            max="12"
            value={pad.pitch}
            onChange={(e) => onUpdatePad({ ...pad, pitch: parseInt(e.target.value) })}
          />
        </div>

        {/* Pan */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">Pan L/R:</span>
            <span className="text-gray-300 font-mono text-[11px]">
              {pad.pan === 0 ? 'Centro' : pad.pan < 0 ? `L ${Math.abs(pad.pan)}%` : `R ${pad.pan}%`}
            </span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            value={pad.pan}
            onChange={(e) => onUpdatePad({ ...pad, pan: parseInt(e.target.value) })}
          />
        </div>

        {/* Reverb Send */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">Efeito Reverb:</span>
            <span className="text-purple-400 font-mono font-bold">{pad.reverbSend}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={pad.reverbSend}
            onChange={(e) => onUpdatePad({ ...pad, reverbSend: parseInt(e.target.value) })}
          />
        </div>

        {/* Release */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">Decaimento / Release:</span>
            <span className="text-emerald-400 font-mono font-bold">{(pad.release || 0.3).toFixed(2)}s</span>
          </div>
          <input
            type="range"
            min="0.05"
            max="1.5"
            step="0.05"
            value={pad.release || 0.3}
            onChange={(e) => onUpdatePad({ ...pad, release: parseFloat(e.target.value) })}
          />
        </div>

        {/* Reverse Toggle */}
        <div className="pt-2 flex items-center justify-between border-t border-white/10">
          <span className="text-xs text-gray-300">Tocar Invertido (Reverse):</span>
          <button
            type="button"
            onClick={() => onUpdatePad({ ...pad, reverse: !pad.reverse })}
            className={`px-3 py-1 rounded-md text-xs font-mono transition-all cursor-pointer ${
              pad.reverse
                ? 'bg-amber-500 text-black font-bold'
                : 'bg-gray-800 text-gray-400 border border-white/10'
            }`}
          >
            {pad.reverse ? 'REVERSE ATIVADO' : 'NORMAL'}
          </button>
        </div>
      </div>
    </div>
  );
};
