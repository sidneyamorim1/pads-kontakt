import React from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import { PadData } from '../utils/audioEngine';

interface CardSettingsPanelProps {
  pad: PadData | null;
  onClose: () => void;
  onUpdatePad: (pad: PadData) => void;
}

// Ajustes de um card de áudio ou de um pad com áudio carregado: loop, fades, "um por vez" e o que acontece ao tocar de novo
export const CardSettingsPanel: React.FC<CardSettingsPanelProps> = ({ pad, onClose, onUpdatePad }) => {
  if (!pad) return null;
  const set = (changes: Partial<PadData>) => onUpdatePad({ ...pad, ...changes });

  const toggle = (on: boolean, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      className={`w-20 shrink-0 py-1 rounded-md text-xs font-mono font-bold border transition-all cursor-pointer ${
        on ? 'bg-fuchsia-500 border-fuchsia-400 text-black' : 'bg-gray-800 border-white/10 text-gray-400'
      }`}
    >
      {on ? 'LIGADO' : 'DESLIGADO'}
    </button>
  );

  const fade = (label: string, value: number, onChange: (v: number) => void) => (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-200 w-20">{label}</span>
      <input type="range" min={0} max={10} step={0.1} value={value} onChange={(e) => onChange(Number(e.target.value))} className="flex-1" />
      <span className="text-xs text-fuchsia-300 font-mono w-12 text-right">{value ? `${value.toFixed(1)} s` : 'sem'}</span>
    </div>
  );

  const row = 'flex items-center justify-between gap-4 border-t border-white/5';
  const retrigger = pad.retrigger ?? 'stop';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-[#140f1a] border border-fuchsia-500/30 rounded-2xl w-[30rem] max-w-[92vw] shadow-2xl flex flex-col gap-4"
        style={{ padding: '18px 20px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold flex items-center gap-2 min-w-0">
            <SlidersHorizontal className="w-5 h-5 text-fuchsia-400 shrink-0" />
            <span className="truncate">{pad.playToEnd ? `Áudio ${pad.id - 12}` : `Pad ${pad.id}`} — <span className="text-fuchsia-300">{pad.name}</span></span>
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        <div className={row} style={{ paddingTop: 12 }}>
          <div>
            <div className="text-sm text-gray-200">Repetir (loop)</div>
            <div className="text-[11px] text-gray-500">Toca sem parar até você parar.</div>
          </div>
          {toggle(!!pad.loop, () => set({ loop: !pad.loop }))}
        </div>

        <div className="flex flex-col gap-2 border-t border-white/5" style={{ paddingTop: 12 }}>
          {fade('Fade in', pad.fadeIn ?? 0, v => set({ fadeIn: v }))}
          {fade('Fade out', pad.fadeOut ?? 0, v => set({ fadeOut: v }))}
          <span className="text-[11px] text-gray-500">O fade out acontece ao parar e no fim do áudio.</span>
        </div>

        <div className={row} style={{ paddingTop: 12 }}>
          <div>
            <div className="text-sm text-gray-200">Um por vez</div>
            <div className="text-[11px] text-gray-500">{pad.playToEnd
              ? 'Ao tocar, para os outros cards que também têm esta opção.'
              : 'Ao tocar, para os outros pads que também têm esta opção.'}</div>
          </div>
          {toggle(!!pad.exclusive, () => set({ exclusive: !pad.exclusive }))}
        </div>

        <div className={row} style={{ paddingTop: 12 }}>
          <div>
            <div className="text-sm text-gray-200">Tocar de novo enquanto toca</div>
            <div className="text-[11px] text-gray-500">"Para": o mesmo botão liga e desliga (também no controlador).</div>
          </div>
          <div className="flex shrink-0 rounded-md overflow-hidden border border-white/10">
            {(['restart', 'stop'] as const).map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => set({ retrigger: mode })}
                className={`w-20 py-1 text-xs font-mono font-bold transition-all cursor-pointer ${
                  retrigger === mode ? 'bg-fuchsia-500 text-black' : 'bg-gray-800 text-gray-400'
                }`}
              >
                {mode === 'restart' ? 'REINICIA' : 'PARA'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
