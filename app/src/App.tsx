import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import { SOUND_KITS, withSidePads } from './data/soundKits';
import { PadData, audioEngine } from './utils/audioEngine';
import { Header } from './components/Header';
import { PadHardware } from './components/PadHardware';
import { PadEditor } from './components/PadEditor';
import { PresetBar } from './components/PresetBar';
import { OutputPanel } from './components/OutputPanel';
import { useAudioOutput } from './utils/useAudioOutput';
import { Preset, StoredPad, SESSION_ID, presetStore, toStoredPads } from './utils/presetStore';

// Recarrega os samples salvos de cada pad e decodifica de volta para AudioBuffer.
async function hydratePads(stored: StoredPad[]): Promise<PadData[]> {
  return Promise.all(stored.map(async (pad) => {
    if (!pad.customSampleId) return pad;
    try {
      const sample = await presetStore.getSample(pad.customSampleId);
      if (sample) return { ...pad, customBuffer: await audioEngine.decode(sample.data) };
    } catch (err) {
      console.error('Erro ao recarregar sample:', err);
    }
    const { customSampleId, customFileName, ...rest } = pad;
    return rest;
  }));
}

export function App() {
  const [activeKitId, setActiveKitId] = useState<string>(SOUND_KITS[0].id);
  const [pads, setPads] = useState<PadData[]>(SOUND_KITS[0].pads);
  const [selectedPadId, setSelectedPadId] = useState<number>(1);
  const [activePadStates, setActivePadStates] = useState<Record<number, boolean>>({});
  const [playingPads, setPlayingPads] = useState<Record<number, boolean>>({});
  
  // MIDI State
  const [midiConnected, setMidiConnected] = useState<boolean>(false);
  const [midiDeviceName, setMidiDeviceName] = useState<string | null>(null);
  const [midiLearnPadId, setMidiLearnPadId] = useState<number | null>(null);
  const [lastMidiEvent, setLastMidiEvent] = useState<{ type: 'note' | 'cc'; val: number; ch: number } | null>(null);

  // Saída de áudio (placa, canais e volumes)
  const output = useAudioOutput();
  const [isOutputOpen, setIsOutputOpen] = useState<boolean>(false);
  const outputLabel = output.devices.find(d => d.id === output.settings.deviceId)?.label
    .replace(/\s*\((Built-in|Virtual|DisplayPort|HDMI|USB)\)$/i, '') ?? 'Saída padrão';

  // Presets
  const [presets, setPresets] = useState<Preset[]>([]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState<boolean>(false);


  // Handle kit selection
  const handleSelectKit = (kitId: string) => {
    const kit = SOUND_KITS.find(k => k.id === kitId);
    if (kit) {
      audioEngine.stopAllFull();
      setActiveKitId(kit.id);
      setPads(kit.pads);
      setSelectedPadId(1);
      setActivePresetId(null);
    }
  };

  // Ao abrir: prepara o áudio (evita atraso no primeiro toque) e restaura a última sessão
  useEffect(() => {
    audioEngine.init();
    (async () => {
      try {
        setPresets(await presetStore.listPresets());
        const session = await presetStore.getPreset(SESSION_ID);
        if (session) {
          setActiveKitId(session.kitId);
          setPads(withSidePads(await hydratePads(session.pads)));
          setActivePresetId(session.activePresetId ?? null);
        }
      } catch (err) {
        console.error('Erro ao restaurar a sessão:', err);
      }
      setSessionLoaded(true);
    })();
  }, []);

  const saveSession = useCallback(() => presetStore.putPreset({
    id: SESSION_ID,
    name: SESSION_ID,
    kitId: activeKitId,
    pads: toStoredPads(pads),
    activePresetId,
    updatedAt: Date.now(),
  }), [activeKitId, pads, activePresetId]);

  // Salva a sessão automaticamente a cada mudança
  const saveSessionRef = useRef(saveSession);
  saveSessionRef.current = saveSession;
  useEffect(() => {
    if (!sessionLoaded) return;
    const t = setTimeout(() => saveSessionRef.current().catch(console.error), 400);
    return () => clearTimeout(t);
  }, [sessionLoaded, saveSession]);

  const activePreset = presets.find(p => p.id === activePresetId) || null;
  const presetDirty = useMemo(
    () => !!activePreset && JSON.stringify(activePreset.pads) !== JSON.stringify(toStoredPads(pads)),
    [activePreset, pads]
  );

  const handleLoadPreset = async (id: string) => {
    const preset = await presetStore.getPreset(id);
    if (!preset) return;
    audioEngine.stopAllFull();
    setActiveKitId(preset.kitId);
    setPads(withSidePads(await hydratePads(preset.pads)));
    setActivePresetId(preset.id);
    setSelectedPadId(1);
  };

  const handleSavePreset = async (name: string, overwriteId: string | null) => {
    const preset: Preset = {
      id: overwriteId ?? crypto.randomUUID(),
      name,
      kitId: activeKitId,
      pads: toStoredPads(pads),
      updatedAt: Date.now(),
    };
    await presetStore.putPreset(preset);
    setPresets(await presetStore.listPresets());
    setActivePresetId(preset.id);
  };

  const handleDeletePreset = async (id: string) => {
    // Grava a sessão antes, para a limpeza não apagar samples que estão nos pads agora
    await saveSession();
    await presetStore.deletePreset(id);
    setPresets(await presetStore.listPresets());
    if (activePresetId === id) setActivePresetId(null);
  };

  // Trigger Pad Sound
  const triggerPad = useCallback((pad: PadData, velocity: number = 1.0) => {
    audioEngine.triggerPad(pad, velocity);

    // Flash active state
    setActivePadStates(prev => ({ ...prev, [pad.id]: true }));
    setTimeout(() => {
      setActivePadStates(prev => ({ ...prev, [pad.id]: false }));
    }, 120);
  }, []);

  // Cards laterais acendem enquanto o áudio toca
  useEffect(() => {
    audioEngine.onPlayingChange((padId, playing) => setPlayingPads(prev => ({ ...prev, [padId]: playing })));
  }, []);

  // Update single pad settings
  const handleUpdatePad = (updatedPad: PadData) => {
    setPads(prev => prev.map(p => p.id === updatedPad.id ? updatedPad : p));
  };

  // Custom audio file upload (salvo no armazenamento local para os presets)
  const handleUploadSample = async (padId: number, file: File) => {
    const data = await file.arrayBuffer();
    let buffer: AudioBuffer;
    try {
      buffer = await audioEngine.decode(data);
    } catch (err) {
      console.error('Erro ao decodificar áudio:', err);
      alert(`Não foi possível abrir "${file.name}".\nFormatos aceitos: WAV, AIFF, MP3, FLAC, M4A/AAC e OGG.`);
      return;
    }
    const sampleId = crypto.randomUUID();
    await presetStore.putSample({ id: sampleId, fileName: file.name, data });
    setPads(prev => prev.map(p => p.id === padId ? {
      ...p,
      customBuffer: buffer,
      customFileName: file.name,
      customSampleId: sampleId
    } : p));
  };

  // Web MIDI API setup with support for both NoteOn & ControlChange (CC)
  const requestMidiAccess = useCallback(async () => {
    if (!navigator.requestMIDIAccess) {
      alert("Seu navegador não suporta a API Web MIDI. Recomendamos o Google Chrome, Brave ou Edge.");
      return;
    }

    try {
      const midiAccess = await navigator.requestMIDIAccess({ sysex: true }).catch(() => 
        navigator.requestMIDIAccess({ sysex: false })
      );

      const updateInputs = (access: MIDIAccess) => {
        const currentInputs = Array.from(access.inputs.values());
        if (currentInputs.length > 0) {
          setMidiConnected(true);
          const devNames = currentInputs.map(i => i.name).filter(Boolean).join(', ');
          setMidiDeviceName(devNames || 'Controlador USB MIDI');

          currentInputs.forEach(input => {
            input.onmidimessage = (event: MIDIMessageEvent) => {
              const [status, data1, data2] = event.data || [0, 0, 0];
              const command = status >> 4; // 9 = NoteOn, 11 = CC, 8 = NoteOff
              const channel = (status & 0x0F) + 1;

              let isTrigger = false;
              let midiType: 'note' | 'cc' = 'note';

              if (command === 9 && data2 > 0) {
                isTrigger = true;
                midiType = 'note';
              } else if (command === 11 && data2 > 0) {
                isTrigger = true;
                midiType = 'cc';
              }

              if (isTrigger) {
                // Update Live Monitor
                setLastMidiEvent({ type: midiType, val: data1, ch: channel });

                // If in MIDI Learn Mode
                if (midiLearnPadId !== null) {
                  setPads(prev => prev.map(p => p.id === midiLearnPadId ? { 
                    ...p, 
                    midiNote: data1, 
                    midiType: midiType 
                  } : p));
                  setMidiLearnPadId(null);
                  confetti({ particleCount: 40, spread: 70, origin: { y: 0.8 } });
                  return;
                }

                // Match pad by assigned MIDI note/cc and type
                const matchedPad = pads.find(p => p.midiNote === data1 && (p.midiType || 'note') === midiType);
                if (matchedPad) {
                  triggerPad(matchedPad, data2 / 127);
                }
              }
            };
          });
        } else {
          setMidiConnected(false);
          setMidiDeviceName(null);
        }
      };

      updateInputs(midiAccess);

      midiAccess.onstatechange = () => {
        updateInputs(midiAccess);
      };
    } catch (err) {
      console.error("Erro ao solicitar acesso MIDI:", err);
      setMidiConnected(false);
    }
  }, [pads, midiLearnPadId, triggerPad]);

  useEffect(() => {
    requestMidiAccess();
  }, [requestMidiAccess]);

  // Keyboard Shortcuts (1-=, QWER / ASDF / ZXCV)
  useEffect(() => {
    const keyToPadMap: Record<string, number> = {
      '1': 1, '2': 2, '3': 3, '4': 4,
      '5': 5, '6': 6, '7': 7, '8': 8,
      '9': 9, '0': 10, '-': 11, '=': 12,
      'q': 1, 'w': 2, 'e': 3, 'r': 4,
      'a': 5, 's': 6, 'd': 7, 'f': 8,
      'z': 9, 'x': 10, 'c': 11, 'v': 12,
      // 9 cards laterais (à direita de R/F/V no teclado)
      't': 13, 'y': 14, 'u': 19,
      'g': 15, 'h': 16, 'j': 20,
      'b': 17, 'n': 18, 'm': 21
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing inside input fields
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      const padId = keyToPadMap[e.key.toLowerCase()];
      if (padId) {
        const targetPad = pads.find(p => p.id === padId);
        if (targetPad) {
          triggerPad(targetPad);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pads, triggerPad]);

  // Update pad name directly
  const handleUpdatePadName = (padId: number, newName: string) => {
    setPads(prev => prev.map(p => p.id === padId ? { ...p, name: newName } : p));
  };

  const selectedPad = pads.find(p => p.id === selectedPadId) || pads[0];

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <Header
        soundKits={SOUND_KITS}
        activeKitId={activeKitId}
        onSelectKit={handleSelectKit}
        midiConnected={midiConnected}
        midiDeviceName={midiDeviceName}
        onRequestMidiAccess={requestMidiAccess}
        masterVolume={output.settings.master}
        onSetMasterVolume={output.setMaster}
        outputLabel={outputLabel}
        onOpenOutput={() => setIsOutputOpen(true)}
      />

      <OutputPanel
        isOpen={isOutputOpen}
        onClose={() => setIsOutputOpen(false)}
        settings={output.settings}
        devices={output.devices}
        channelCount={output.channelCount}
        missingDevice={output.missingDevice}
        onSetDevice={output.setDevice}
        onSetGroup={output.setGroup}
      />

      {/* Main Content Area: Side-by-Side DAW Console */}
      {/* Ocupa toda a janela abaixo do topo; padding inline porque o reset do index.css anula px/py */}
      <main className="flex-1 min-h-0 w-full flex flex-col gap-3 items-stretch" style={{ padding: '10px 16px 16px' }}>
        <PresetBar
          presets={presets}
          activePresetId={activePresetId}
          dirty={presetDirty}
          onLoad={handleLoadPreset}
          onSave={handleSavePreset}
          onDelete={handleDeletePreset}
        />
        <PadHardware
          pads={pads}
          activePadId={selectedPadId}
          activePadStates={activePadStates}
          playingPads={playingPads}
          onTriggerPad={triggerPad}
          onStopPad={(padId) => audioEngine.stopFull(padId)}
          onStopAllSide={() => audioEngine.stopAllFull()}
          onSelectPad={(pad) => setSelectedPadId(pad.id)}
          onUploadSample={handleUploadSample}
          onUpdatePadName={handleUpdatePadName}
        />
        {/* Hidden Inspector (optional) */}
        <div className="hidden">
          <PadEditor
            pad={selectedPad}
            onUpdatePad={handleUpdatePad}
            onTriggerPad={triggerPad}
            onUploadSample={handleUploadSample}
          />
        </div>
      </main>

    </div>
  );
}
