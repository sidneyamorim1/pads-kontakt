import { useCallback, useEffect, useState } from 'react';
import { audioEngine, BusName, ChannelRoute } from './audioEngine';

// Configuração de saída de áudio: placa/dispositivo, canal de cada grupo e volumes.
// Fica salva neste computador (localStorage) e é reaplicada ao abrir o app.

export interface GroupOutput extends ChannelRoute {
  volume: number; // 0 a 100
}

export interface OutputSettings {
  deviceId: string; // '' = padrão do sistema
  master: number;   // 0 a 100
  pads: GroupOutput;
  audios: GroupOutput;
}

export interface OutputDevice {
  id: string;
  label: string;
}

const STORAGE_KEY = 'sampler-studio-output';

const DEFAULT_SETTINGS: OutputSettings = {
  deviceId: '',
  master: 85,
  pads: { first: 0, stereo: true, volume: 100 },
  audios: { first: 0, stereo: true, volume: 100 },
};

function loadSettings(): OutputSettings {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved) return { ...DEFAULT_SETTINGS, ...saved, pads: { ...DEFAULT_SETTINGS.pads, ...saved.pads }, audios: { ...DEFAULT_SETTINGS.audios, ...saved.audios } };
  } catch {
    // configuração corrompida: usa o padrão
  }
  return DEFAULT_SETTINGS;
}

export function useAudioOutput() {
  const [settings, setSettings] = useState<OutputSettings>(loadSettings);
  const [devices, setDevices] = useState<OutputDevice[]>([]);
  const [channelCount, setChannelCount] = useState<number>(2);
  // Dispositivo salvo que não está conectado agora (ex.: placa USB desligada)
  const [missingDevice, setMissingDevice] = useState<boolean>(false);

  const refreshDevices = useCallback(async () => {
    const all = await navigator.mediaDevices.enumerateDevices();
    const outputs = all
      .filter(d => d.kind === 'audiooutput' && d.deviceId !== 'default')
      .map(d => ({ id: d.deviceId, label: d.label || 'Saída de áudio' }));
    setDevices(outputs);
    return outputs;
  }, []);

  // Aplica o dispositivo; se ele sumiu, usa o padrão do sistema sem esquecer a escolha
  const applyDevice = useCallback(async (deviceId: string, available: OutputDevice[]) => {
    const present = !deviceId || available.some(d => d.id === deviceId);
    setMissingDevice(!present);
    try {
      setChannelCount(await audioEngine.setOutputDevice(present ? deviceId : ''));
    } catch (err) {
      console.error('Erro ao trocar a saída de áudio:', err);
      setMissingDevice(true);
      setChannelCount(await audioEngine.setOutputDevice(''));
    }
  }, []);

  // Ao abrir: lista as saídas e aplica a configuração salva
  useEffect(() => {
    (async () => {
      const available = await refreshDevices();
      await applyDevice(settings.deviceId, available);
    })();
    const onChange = async () => applyDevice(loadSettings().deviceId, await refreshDevices());
    navigator.mediaDevices.addEventListener('devicechange', onChange);
    return () => navigator.mediaDevices.removeEventListener('devicechange', onChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rotas e volumes acompanham a configuração (e o número de canais do dispositivo)
  useEffect(() => {
    audioEngine.setVolume('master', settings.master / 100);
    for (const bus of ['pads', 'audios'] as BusName[]) {
      audioEngine.setRoute(bus, settings[bus]);
      audioEngine.setVolume(bus, settings[bus].volume / 100);
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // sem armazenamento: a configuração vale só até fechar o app
    }
  }, [settings, channelCount]);

  const setDevice = useCallback(async (deviceId: string) => {
    setSettings(s => ({ ...s, deviceId }));
    await applyDevice(deviceId, devices);
  }, [applyDevice, devices]);

  const setMaster = useCallback((master: number) => setSettings(s => ({ ...s, master })), []);

  const setGroup = useCallback((bus: BusName, changes: Partial<GroupOutput>) =>
    setSettings(s => ({ ...s, [bus]: { ...s[bus], ...changes } })), []);

  return { settings, devices, channelCount, missingDevice, setDevice, setMaster, setGroup };
}
