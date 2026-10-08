import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Volume2 } from 'lucide-react';
import { SOUND_KITS, SIDE_LAYOUT, withSidePads } from './data/soundKits';
import { PadData, audioEngine } from './utils/audioEngine';
import { Header } from './components/Header';
import { PadHardware } from './components/PadHardware';
import { PadEditor } from './components/PadEditor';
import { PresetBar } from './components/PresetBar';
import { OutputPanel } from './components/OutputPanel';
import { CardSettingsPanel } from './components/CardSettingsPanel';
import { MidiLearnBar } from './components/MidiLearnBar';
import { useAudioOutput } from './utils/useAudioOutput';
import { Preset, StoredPad, StoredSample, SESSION_ID, presetStore, toStoredPads } from './utils/presetStore';
import { buildPresetFile, readPresetFile } from './utils/presetFile';
import { desktop } from './utils/desktop';
import { SaveTarget, canChooseFile, chooseSaveTarget, saveTargetLabel, writeSaveTarget } from './utils/fileSave';
import { MidiMap, bindingFor, bindingLabel, loadMidiMap, saveMidiMap, sameBinding } from './utils/midiMap';

// Ordem do MIDI Learn: os 12 pads e depois os cards na ordem da tela
const LEARN_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, ...SIDE_LAYOUT];

// Recarrega os samples salvos de cada pad e decodifica de volta para AudioBuffer.
// Monta o arquivo .sampler de um preset, com os áudios que ele usa
async function presetFileFor(name: string, kitId: string, pads: StoredPad[]): Promise<Blob> {
  const ids = Array.from(new Set(pads.map(p => p.customSampleId).filter((id): id is string => !!id)));
  const samples = (await Promise.all(ids.map(id => presetStore.getSample(id)))).filter((s): s is StoredSample => !!s);
  return buildPresetFile([{ name, kitId, pads }], samples);
}

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
  const [midiMap, setMidiMap] = useState<MidiMap>(loadMidiMap);
  const [learnMode, setLearnMode] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [learnPadId, setLearnPadId] = useState<number | null>(null);
  const [lastMidiEvent, setLastMidiEvent] = useState<{ type: 'note' | 'cc'; val: number; ch: number } | null>(null);

  // Saída de áudio (placa, canais e volumes)
  const output = useAudioOutput();
  const [isOutputOpen, setIsOutputOpen] = useState<boolean>(false);
  const [settingsPadId, setSettingsPadId] = useState<number | null>(null);
  const outputLabel = output.devices.find(d => d.id === output.settings.deviceId)?.label
    .replace(/\s*\((Built-in|Virtual|DisplayPort|HDMI|USB)\)$/i, '') ?? 'Saída padrão';

  // Presets
  const [presets, setPresets] = useState<Preset[]>([]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState<boolean>(false);
  // Navegador: o som fica bloqueado até o primeiro clique ou tecla na página
  const [audioLocked, setAudioLocked] = useState<boolean>(false);
  // Pasta onde cada preset salvo também é gravado como .sampler (só no app instalado)
  const [backupFolder, setBackupFolder] = useState<string | null>(null);
  useEffect(() => {
    desktop?.getBackupFolder().then(setBackupFolder);
  }, []);


  // Handle kit selection
  const handleSelectKit = (kitId: string) => {
    const kit = SOUND_KITS.find(k => k.id === kitId);
    if (kit) {
      audioEngine.stopAllFull();
      audioEngine.stopAllPads();
      setActiveKitId(kit.id);
      setPads(kit.pads);
      setSelectedPadId(1);
      setActivePresetId(null);
    }
  };

  // Ao abrir: prepara o áudio (evita atraso no primeiro toque) e restaura a última sessão
  useEffect(() => {
    audioEngine.init();
    setAudioLocked(audioEngine.isSuspended());
    audioEngine.onSuspendedChange(setAudioLocked);
    const unlock = () => audioEngine.resume();
    window.addEventListener('pointerdown', unlock, true);
    window.addEventListener('keydown', unlock, true);
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
    return () => {
      window.removeEventListener('pointerdown', unlock, true);
      window.removeEventListener('keydown', unlock, true);
    };
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
    audioEngine.stopAllPads();
    setActiveKitId(preset.kitId);
    setPads(withSidePads(await hydratePads(preset.pads)));
    setActivePresetId(preset.id);
    setSelectedPadId(1);
  };

  // Salva o preset no app e, no app instalado, também no arquivo ligado a ele e na pasta de cópia
  const handleSavePreset = async (name: string, overwriteId: string | null, target?: SaveTarget) => {
    const previous = presets.find(p => p.id === overwriteId);
    const preset: Preset = {
      id: overwriteId ?? crypto.randomUUID(),
      name,
      kitId: activeKitId,
      pads: toStoredPads(pads),
      updatedAt: Date.now(),
      filePath: target ? target.filePath : previous?.filePath,
      fileHandle: target ? target.fileHandle : previous?.fileHandle,
    };
    await presetStore.putPreset(preset);
    setPresets(await presetStore.listPresets());
    setActivePresetId(preset.id);

    const linked = saveTargetLabel(preset);
    if (!linked && !(desktop && backupFolder)) return;
    const data = await (await presetFileFor(name, preset.kitId, preset.pads)).arrayBuffer();
    const failed: string[] = [];
    if (linked) {
      await writeSaveTarget(preset, data).catch(err => { console.error(err); failed.push(linked); });
    }
    if (desktop && backupFolder) {
      await desktop.writeBackup(name, data).catch(err => { console.error(err); failed.push(`${backupFolder} (pasta de cópia)`); });
    }
    if (failed.length) {
      alert(`O preset "${name}" foi salvo no app, mas não foi possível gravar em:\n${failed.join('\n')}\n\nConfira se a pasta (ou o pendrive) está disponível.`);
    }
  };

  // "Salvar como…": a janela do sistema escolhe a pasta e o nome do arquivo (app instalado e Chrome)
  const handleSaveAs = async () => {
    let target;
    try {
      target = await chooseSaveTarget(activePreset?.name ?? 'Novo preset');
    } catch (err) {
      console.error('Erro na janela de salvar:', err);
      alert('Não foi possível abrir a janela de salvar.');
      return;
    }
    if (!target) return;
    const existing = presets.find(p => p.name.toLowerCase() === target.name.toLowerCase());
    const sameFile = existing && target.filePath && existing.filePath === target.filePath;
    if (existing && !sameFile && !window.confirm(`Já existe no app um preset "${existing.name}". Substituir?`)) return;
    await handleSavePreset(target.name, existing?.id ?? null, target);
  };

  const handleDeletePreset = async (id: string) => {
    // Grava a sessão antes, para a limpeza não apagar samples que estão nos pads agora
    await saveSession();
    await presetStore.deletePreset(id);
    setPresets(await presetStore.listPresets());
    if (activePresetId === id) setActivePresetId(null);
  };

  // Exporta o que está na tela (com os áudios) num arquivo .sampler
  const handleExportPreset = async () => {
    const name = activePreset?.name ?? 'Sessão';
    const blob = await presetFileFor(name, activeKitId, toStoredPads(pads));
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${name.replace(/[\\/:*?"<>|]/g, '-')}.sampler`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 10000);
  };

  // Importa arquivos .sampler: grava os áudios, adiciona os presets e abre o primeiro
  const handleImportPresets = async (files: File[]) => {
    const names = new Set((await presetStore.listPresets()).map(p => p.name.toLowerCase()));
    const imported: string[] = [];
    const failed: string[] = [];
    for (const file of files) {
      try {
        const { presets: filePresets, samples } = await readPresetFile(file);
        for (const sample of samples) await presetStore.putSample(sample);
        for (const fp of filePresets) {
          const base = fp.name || file.name.replace(/\.sampler$/i, '');
          let name = base;
          for (let n = 2; names.has(name.toLowerCase()); n++) name = `${base} (${n})`;
          names.add(name.toLowerCase());
          const id = crypto.randomUUID();
          await presetStore.putPreset({ id, name, kitId: fp.kitId, pads: fp.pads, updatedAt: Date.now() });
          imported.push(id);
        }
      } catch (err) {
        console.error('Erro ao importar preset:', err);
        failed.push(file.name);
      }
    }
    setPresets(await presetStore.listPresets());
    if (imported.length) await handleLoadPreset(imported[0]);
    if (failed.length) alert(`Não foi possível importar:\n${failed.join('\n')}\n\nSó arquivos .sampler exportados pelo Sampler Studio são aceitos.`);
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
    // O pad passa a ter o nome do arquivo (sem a extensão); dá para renomear depois no modo edição
    const soundName = file.name.replace(/\.[^.]+$/, '') || file.name;
    setPads(prev => prev.map(p => p.id === padId ? {
      ...p,
      name: soundName,
      customBuffer: buffer,
      customFileName: file.name,
      customSampleId: sampleId
    } : p));
  };

  // Remove o áudio carregado: o pad volta ao som interno. O arquivo some do armazenamento
  // quando nenhum preset usar mais (limpeza ao excluir presets).
  const handleRemoveSample = (padId: number) => {
    audioEngine.stopFull(padId);
    setPads(prev => prev.map(p => {
      if (p.id !== padId) return p;
      const { customBuffer, customFileName, customSampleId, ...rest } = p;
      return rest;
    }));
  };

  // Mapeamento MIDI salvo neste computador
  useEffect(() => saveMidiMap(midiMap), [midiMap]);

  // Mensagem MIDI recebida (Note On ou CC). Fica num ref para o leitor MIDI, registrado uma vez,
  // sempre usar os pads e o mapeamento atuais.
  const handleMidiRef = useRef<(type: 'note' | 'cc', num: number, value: number, ch: number) => void>(() => {});
  handleMidiRef.current = (type, num, value, ch) => {
    setLastMidiEvent({ type, val: num, ch });
    const binding = { type, num };

    if (learnMode) {
      if (learnPadId === null) return;
      setMidiMap(prev => {
        const next = { ...prev };
        const target = pads.find(p => p.id === learnPadId);
        // Se outro pad já usava este botão, ele fica com o botão antigo do pad que está aprendendo (troca)
        const other = pads.find(p => p.id !== learnPadId && sameBinding(bindingFor(p, prev), binding));
        if (other && target) next[other.id] = bindingFor(target, prev);
        next[learnPadId] = binding;
        return next;
      });
      const nextIndex = LEARN_ORDER.indexOf(learnPadId) + 1;
      setLearnPadId(LEARN_ORDER[nextIndex] ?? null);
      return;
    }

    const matchedPad = pads.find(p => sameBinding(bindingFor(p, midiMap), binding));
    if (matchedPad) triggerPad(matchedPad, value / 127);
  };

  // Web MIDI: escuta todos os controladores conectados (Note On e CC)
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
        setMidiConnected(currentInputs.length > 0);
        setMidiDeviceName(currentInputs.length ? currentInputs.map(i => i.name).filter(Boolean).join(', ') || 'Controlador USB MIDI' : null);

        currentInputs.forEach(input => {
          input.onmidimessage = (event: MIDIMessageEvent) => {
            const [status, data1, data2] = event.data || [0, 0, 0];
            const command = status >> 4; // 9 = NoteOn, 11 = CC, 8 = NoteOff
            const channel = (status & 0x0F) + 1;
            if (data2 > 0 && (command === 9 || command === 11)) {
              handleMidiRef.current(command === 9 ? 'note' : 'cc', data1, data2, channel);
            }
          };
        });
      };

      updateInputs(midiAccess);
      midiAccess.onstatechange = () => updateInputs(midiAccess);
    } catch (err) {
      console.error("Erro ao solicitar acesso MIDI:", err);
      setMidiConnected(false);
    }
  }, []);

  useEffect(() => {
    requestMidiAccess();
  }, [requestMidiAccess]);

  const toggleLearn = () => {
    setLearnMode(on => !on);
    setLearnPadId(null);
  };

  // Esc sai do MIDI Learn
  useEffect(() => {
    if (!learnMode) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setLearnMode(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [learnMode]);

  const bindingLabels = useMemo(
    () => Object.fromEntries(pads.map(p => [p.id, bindingLabel(bindingFor(p, midiMap))])),
    [pads, midiMap]
  );

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
        learnMode={learnMode}
        onToggleLearn={toggleLearn}
        editMode={editMode}
        onToggleEdit={() => setEditMode(on => !on)}
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

      <CardSettingsPanel
        pad={pads.find(p => p.id === settingsPadId) ?? null}
        onClose={() => setSettingsPadId(null)}
        onUpdatePad={handleUpdatePad}
      />

      {/* Navegador: aviso enquanto o som está bloqueado (o MIDI só toca depois de um clique na página) */}
      {audioLocked && (
        <button
          type="button"
          onClick={() => audioEngine.resume()}
          className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold cursor-pointer"
          style={{ padding: '8px 16px' }}
        >
          <Volume2 className="w-4 h-4" />
          Som bloqueado pelo navegador até o primeiro clique: clique aqui para ativar o som e o controlador MIDI
        </button>
      )}

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
          onExport={handleExportPreset}
          onSaveAs={canChooseFile ? handleSaveAs : undefined}
          onImport={handleImportPresets}
          backupFolder={desktop ? backupFolder : undefined}
          onChooseBackup={async () => desktop && setBackupFolder(await desktop.chooseBackupFolder())}
          onClearBackup={async () => desktop && setBackupFolder(await desktop.clearBackupFolder())}
        />
        {learnMode && (
          <MidiLearnBar
            targetPad={pads.find(p => p.id === learnPadId) ?? null}
            lastMidiEvent={lastMidiEvent}
            onReset={() => setMidiMap({})}
            onDone={toggleLearn}
          />
        )}
        <PadHardware
          pads={pads}
          activePadId={selectedPadId}
          activePadStates={activePadStates}
          playingPads={playingPads}
          onTriggerPad={triggerPad}
          onStopPad={(padId) => (padId > 12 ? audioEngine.stopFull(padId) : audioEngine.stopPad(padId))}
          onStopAllSide={() => audioEngine.stopAllFull()}
          onStopAllMain={() => audioEngine.stopAllPads()}
          onSelectPad={(pad) => setSelectedPadId(pad.id)}
          onUploadSample={handleUploadSample}
          onRemoveSample={handleRemoveSample}
          onUpdatePadName={handleUpdatePadName}
          onOpenCardSettings={setSettingsPadId}
          editMode={editMode}
          learnMode={learnMode}
          learnPadId={learnPadId}
          bindingLabels={bindingLabels}
          onLearnSelect={setLearnPadId}
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
