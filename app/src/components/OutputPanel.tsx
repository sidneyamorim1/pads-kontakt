import React from 'react';
import { X, Speaker, AlertTriangle } from 'lucide-react';
import { BusName } from '../utils/audioEngine';
import { GroupOutput, OutputDevice, OutputSettings } from '../utils/useAudioOutput';

interface OutputPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: OutputSettings;
  devices: OutputDevice[];
  channelCount: number;
  missingDevice: boolean;
  onSetDevice: (deviceId: string) => void;
  onSetGroup: (bus: BusName, changes: Partial<GroupOutput>) => void;
}

// Opções de canal conforme o dispositivo: pares estéreo (1-2, 3-4…) e canais mono (1, 2, 3…)
function channelOptions(count: number) {
  const options: { value: string; label: string }[] = [];
  for (let i = 0; i + 1 < count; i += 2) options.push({ value: `s${i}`, label: `Saídas ${i + 1}-${i + 2} (estéreo)` });
  for (let i = 0; i < count; i++) options.push({ value: `m${i}`, label: `Saída ${i + 1} (mono)` });
  return options;
}

const routeValue = (g: GroupOutput, count: number) => {
  const fits = g.stereo ? g.first + 1 < count : g.first < count;
  return fits ? `${g.stereo ? 's' : 'm'}${g.first}` : 's0';
};

const GROUPS: { bus: BusName; label: string; color: string }[] = [
  { bus: 'pads', label: '12 Pads', color: 'text-amber-400' },
  { bus: 'audios', label: 'Áudios', color: 'text-fuchsia-300' },
];

export const OutputPanel: React.FC<OutputPanelProps> = ({
  isOpen, onClose, settings, devices, channelCount, missingDevice, onSetDevice, onSetGroup
}) => {
  if (!isOpen) return null;
  const options = channelOptions(channelCount);
  const selectClass = 'w-full bg-black/60 border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-amber-500 cursor-pointer';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-[#121419] border border-white/10 rounded-2xl w-[30rem] max-w-[92vw] shadow-2xl flex flex-col gap-4"
        style={{ padding: '18px 20px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold flex items-center gap-2"><Speaker className="w-5 h-5 text-amber-500" /> Saída de áudio</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Placa / dispositivo</span>
          <select value={settings.deviceId} onChange={(e) => onSetDevice(e.target.value)} className={selectClass}>
            <option value="" className="bg-gray-900">Padrão do sistema</option>
            {devices.map(d => <option key={d.id} value={d.id} className="bg-gray-900">{d.label}</option>)}
            {missingDevice && settings.deviceId && !devices.some(d => d.id === settings.deviceId) && (
              <option value={settings.deviceId} className="bg-gray-900">Dispositivo salvo (desconectado)</option>
            )}
          </select>
          <span className="text-[11px] text-gray-500 font-mono">{channelCount} canais de saída</span>
          {missingDevice && (
            <span className="text-[11px] text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Dispositivo salvo não encontrado — tocando no padrão do sistema.
            </span>
          )}
        </label>

        {GROUPS.map(({ bus, label, color }) => {
          const group = settings[bus];
          return (
            <div key={bus} className="flex flex-col gap-2 border-t border-white/5" style={{ paddingTop: 12 }}>
              <span className={`text-sm font-bold ${color}`}>{label}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-14">Canal</span>
                <select
                  value={routeValue(group, channelCount)}
                  onChange={(e) => onSetGroup(bus, { stereo: e.target.value[0] === 's', first: Number(e.target.value.slice(1)) })}
                  className={selectClass}
                >
                  {options.map(o => <option key={o.value} value={o.value} className="bg-gray-900">{o.label}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-14">Volume</span>
                <input
                  type="range" min={0} max={100} value={group.volume}
                  onChange={(e) => onSetGroup(bus, { volume: Number(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-xs text-gray-300 font-mono w-10 text-right">{group.volume}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
