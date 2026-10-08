import React, { useRef } from 'react';
import { PadData } from '../utils/audioEngine';
import { SIDE_LAYOUT } from '../data/soundKits';
import { Music, Upload, MousePointerClick, PlayCircle, Square, SlidersHorizontal, Repeat, X } from 'lucide-react';

interface PadHardwareProps {
  pads: PadData[];
  activePadId: number;
  activePadStates: Record<number, boolean>;
  playingPads: Record<number, boolean>;
  onTriggerPad: (pad: PadData) => void;
  onStopPad: (padId: number) => void;
  onStopAllSide: () => void;
  onSelectPad: (pad: PadData) => void;
  onUploadSample: (padId: number, file: File) => void;
  onRemoveSample: (padId: number) => void;
  onUpdatePadName: (padId: number, newName: string) => void;
  onOpenCardSettings: (padId: number) => void;
  // Modo edição: mostra os botões de áudio, ajustes e renomear (fora dele, os cards ficam limpos para tocar)
  editMode: boolean;
  // MIDI Learn: clicar num pad escolhe qual vai aprender, em vez de tocar
  learnMode: boolean;
  learnPadId: number | null;
  bindingLabels: Record<number, string>;
  onLearnSelect: (padId: number) => void;
}

// Resumo dos ajustes de um card de áudio, mostrado no rodapé dele
function cardModeLabel(pad: PadData): string {
  const parts = [
    pad.loop && 'Loop',
    pad.exclusive && '1 por vez',
    (pad.fadeIn || pad.fadeOut) && 'Fade',
    pad.retrigger === 'stop' && 'Liga/desliga',
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : 'Até o fim';
}

export const PadHardware: React.FC<PadHardwareProps> = ({
  pads,
  activePadId,
  activePadStates,
  playingPads,
  onTriggerPad,
  onStopPad,
  onStopAllSide,
  onSelectPad,
  onUploadSample,
  onRemoveSample,
  onUpdatePadName,
  onOpenCardSettings,
  editMode,
  learnMode,
  learnPadId,
  bindingLabels,
  onLearnSelect
}) => {
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (padId: number, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!editMode) return; // fora do modo edição, um arquivo solto sem querer não troca o som
    const file = e.dataTransfer.files?.[0];
    // Alguns formatos (ex.: .aif, .flac) chegam sem tipo; a decodificação avisa se não for áudio
    if (file && (file.type.startsWith('audio/') || file.type === '')) {
      onUploadSample(padId, file);
    }
  };

  const mainPads = pads.filter(p => !p.playToEnd).slice(0, 12);
  const sidePads = SIDE_LAYOUT
    .map(id => pads.find(p => p.id === id && p.playToEnd))
    .filter((p): p is PadData => !!p);

  // `side` = card lateral (toca até o fim): acende enquanto o áudio toca e usa a cor rosa/violeta
  const renderPad = (pad: PadData, side: boolean) => {
    const isActive = !!activePadStates[pad.id] || (side && !!playingPads[pad.id]);
    const isSelected = activePadId === pad.id;
    const isLearnTarget = learnMode && learnPadId === pad.id;
    const selectedBorder = side
      ? 'border-fuchsia-400/80 bg-fuchsia-500/10 shadow-md shadow-fuchsia-500/20'
      : 'border-amber-500/80 bg-amber-500/10 shadow-md shadow-amber-500/15';
    const idleBorder = side ? 'border-fuchsia-500/15 hover:bg-fuchsia-500/5' : 'border-white/5 hover:bg-white/5';
    const uploadStyle = side
      ? 'bg-fuchsia-500/10 hover:bg-fuchsia-500/30 text-fuchsia-300 border-fuchsia-500/30'
      : 'bg-amber-500/10 hover:bg-amber-500/30 text-amber-400 border-amber-500/20';

    return (
      <div
        key={pad.id}
        onClick={() => onSelectPad(pad)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(pad.id, e)}
        className={`min-w-0 min-h-0 flex flex-col items-center p-1 sm:p-2 rounded-xl transition-all cursor-pointer relative group border ${
          isSelected ? selectedBorder : idleBorder
        }`}
      >
        {/* Hidden File Input */}
        <input
          ref={(el) => (fileInputRefs.current[pad.id] = el)}
          type="file"
          accept="audio/*,.wav,.aif,.aiff,.flac,.mp3,.m4a,.ogg"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUploadSample(pad.id, file);
          }}
          className="hidden"
        />

        {/* Header LED & Title */}
        <div className="w-full flex justify-between items-center mb-1.5 px-1">
          <div className="flex items-center gap-1.5">
            <span className={`led-indicator ${isActive ? 'active' : isSelected ? 'amber' : ''}`} />
            <span className={`text-[11px] font-mono font-bold whitespace-nowrap ${side ? 'text-fuchsia-200' : 'text-gray-200'}`}>
              {side ? `ÁUDIO ${pad.id - 12}` : `PAD ${pad.id}`}
            </span>
          </div>

          <div className="flex items-center gap-1">
          {/* Ajustes do card lateral (loop, fades, um por vez) */}
          {side && editMode && (
            <button
              type="button"
              title="Ajustes deste áudio: loop, fade, um por vez"
              onClick={(e) => {
                e.stopPropagation();
                onOpenCardSettings(pad.id);
              }}
              className={`px-1.5 py-0.5 rounded transition-colors border flex items-center text-[9px] font-mono ${uploadStyle}`}
            >
              <SlidersHorizontal className="w-3 h-3" />
            </button>
          )}

          {/* Parar o áudio do card lateral */}
          {side && (
            <button
              type="button"
              title="Parar este áudio"
              disabled={!playingPads[pad.id]}
              onClick={(e) => {
                e.stopPropagation();
                onStopPad(pad.id);
              }}
              className="px-1.5 py-0.5 rounded transition-colors border flex items-center gap-1 text-[9px] font-mono bg-red-500/15 hover:bg-red-500/35 text-red-300 border-red-500/40 disabled:opacity-25 disabled:cursor-default disabled:hover:bg-red-500/15"
            >
              <Square className="w-2.5 h-2.5 fill-current" />
              <span className="hidden xl:inline">Parar</span>
            </button>
          )}

          {/* Remover o áudio carregado (volta ao som interno) */}
          {editMode && pad.customFileName && (
            <button
              type="button"
              title={`Remover o áudio "${pad.customFileName}"`}
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Remover o áudio "${pad.customFileName}" do ${side ? `Áudio ${pad.id - 12}` : `Pad ${pad.id}`}?`)) onRemoveSample(pad.id);
              }}
              className="px-1 py-0.5 rounded transition-colors border flex items-center text-[9px] bg-gray-800/60 hover:bg-red-500/35 text-gray-400 hover:text-red-200 border-white/10 hover:border-red-500/40"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          {/* Upload Audio Quick Icon */}
          {editMode && (
          <button
            type="button"
            title="Carregar Áudio para este Pad"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRefs.current[pad.id]?.click();
            }}
            className={`px-1.5 py-0.5 rounded transition-colors border flex items-center gap-1 text-[9px] font-mono ${uploadStyle}`}
          >
            <Upload className="w-3 h-3" />
            {/* Nos cards laterais o texto só aparece em janelas largas (senão não cabe ao lado do Parar) */}
            <span className={side ? 'hidden xl:inline' : 'hidden sm:inline'}>Som</span>
          </button>
          )}
          </div>
        </div>

        {/* Tactile Pad Button for Mouse (Perfect Medium Size) */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.stopPropagation();
            if (learnMode) {
              onLearnSelect(pad.id);
              return;
            }
            onSelectPad(pad);
            onTriggerPad(pad);
          }}
          className={`w-full flex-1 min-h-0 rounded-xl pad-button flex flex-col items-center justify-between p-1.5 sm:p-3 transition-all cursor-pointer active:scale-95 ${
            isActive ? 'active shadow-cyan-500/40' : ''
          } ${isLearnTarget ? 'animate-pulse' : ''}`}
          style={{
            borderColor: isLearnTarget ? '#22d3ee' : isActive ? (side ? '#f0abfc' : '#00f0ff') : isSelected && !learnMode ? (side ? '#e879f9' : '#ff8c00') : (side ? 'rgba(232,121,249,0.25)' : 'rgba(255,255,255,0.08)'),
            ...(isLearnTarget ? { borderWidth: 2 } : {}),
            ...(side ? { background: `linear-gradient(160deg, ${pad.color}33, rgba(20,12,28,0.95) 70%)` } : {})
          }}
        >
          {/* Top Color Strip */}
          <div
            className="w-full h-1 rounded-full opacity-80"
            style={{ backgroundColor: pad.color || '#ff8c00' }}
          />

          {/* Center Sound Info */}
          <div className="flex flex-col items-center justify-center my-auto text-center pointer-events-none w-full px-1">
            {side
              ? <PlayCircle className={`w-4 h-4 mb-1 transition-transform ${isActive ? 'scale-125 text-fuchsia-200' : 'text-fuchsia-300'}`} />
              : <Music className={`w-4 h-4 mb-1 transition-transform ${isActive ? 'scale-125 text-cyan-300' : 'text-gray-300'}`} />}

            <span className="text-[10px] sm:text-xs font-bold text-white truncate max-w-full leading-tight">
              {pad.name}
            </span>

            {learnMode && (
              <span className={`text-[10px] font-mono font-bold mt-0.5 ${isLearnTarget ? 'text-cyan-300' : 'text-cyan-500'}`}>
                {isLearnTarget ? 'aguardando…' : bindingLabels[pad.id]}
              </span>
            )}

            {!learnMode && pad.customFileName && (
              <span className={`hidden sm:block text-[9px] font-mono truncate max-w-full mt-0.5 ${side ? 'text-fuchsia-300' : 'text-emerald-400'}`}>
                {pad.customFileName}
              </span>
            )}
          </div>

          {/* Number Label */}
          <div className="w-full flex justify-between items-center text-gray-400 text-[9px] font-mono">
            <span className={`hidden sm:flex items-center gap-1 text-[8px] truncate ${side && cardModeLabel(pad) !== 'Até o fim' ? 'text-fuchsia-300' : 'text-gray-500'}`}>
              {side && pad.loop && <Repeat className="w-2.5 h-2.5 shrink-0" />}
              {side ? cardModeLabel(pad) : 'Clique'}
            </span>
            <span className={`ml-auto text-xs font-bold ${side ? 'text-fuchsia-200 uppercase' : 'text-gray-200 group-hover:text-amber-400'}`}>
              {side ? pad.keyTrigger : pad.id}
            </span>
          </div>
        </button>

        {/* Inline Rename Input */}
        {editMode && (
        <div className="w-full mt-1.5 hidden sm:block">
          <input
            type="text"
            value={pad.name}
            onChange={(e) => onUpdatePadName(pad.id, e.target.value)}
            placeholder="Alterar Nome..."
            onClick={(e) => e.stopPropagation()}
            className={`w-full bg-black/60 border rounded px-2 py-0.5 text-[10px] text-white text-center focus:outline-none font-medium ${
              side ? 'border-fuchsia-500/20 hover:border-fuchsia-400/50 focus:border-fuchsia-400' : 'border-white/10 hover:border-amber-500/50 focus:border-amber-500'
            }`}
          />
        </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="w-full flex-1 min-h-0 flex items-stretch gap-3"
    >
      {/* Chassis Frame */}
      <div className="flex-[4] min-w-0 controller-frame rounded-2xl p-4 sm:p-5 flex flex-col gap-3 shadow-2xl relative border border-white/10 overflow-hidden">
        {/* Top Chassis Header */}
        <div className="flex justify-between items-center text-xs text-gray-400 font-mono tracking-wider border-b border-white/5 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-white font-bold tracking-wider uppercase text-xs">CONTROLADOR DE 12 PADS TÁTEIS</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-md border border-cyan-500/30 flex items-center gap-1.5 font-sans font-semibold">
              <MousePointerClick className="w-3.5 h-3.5 text-cyan-400" /> {editMode ? 'Modo edição: arraste áudios para os pads' : 'Clique no mouse ou use o teclado / MIDI'}
            </span>
          </div>
        </div>

        {/* 12 Pads Grid: sempre 4 colunas x 3 linhas */}
        <div className="flex-1 min-h-0 grid grid-cols-4 grid-rows-3 gap-1.5 sm:gap-3 my-1">
          {mainPads.map(pad => renderPad(pad, false))}
        </div>

        {/* Chassis Footer Label */}
        <div className="flex justify-end items-center gap-1 text-xs text-gray-400 pt-2 border-t border-white/5 font-mono">
          <span className="text-gray-400">
            12 Pads Autônomos
          </span>
        </div>
      </div>

      {/* Painel lateral: 6 cards que tocam o áudio inteiro (clicar de novo reinicia) */}
      {sidePads.length > 0 && (
        <div className="flex-[3] min-w-0 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 shadow-2xl border border-fuchsia-500/30 bg-gradient-to-b from-fuchsia-950/40 to-[#120c18]">
          <div className="flex justify-between items-center text-xs font-mono tracking-wider border-b border-fuchsia-500/15 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-400 animate-pulse"></span>
              <span className="text-fuchsia-100 font-bold tracking-wider uppercase text-xs">ÁUDIOS</span>
            </div>
            <button
              type="button"
              onClick={onStopAllSide}
              disabled={!sidePads.some(p => playingPads[p.id])}
              title="Parar todos os áudios"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-950/60 hover:bg-red-900/70 border border-red-500/40 text-red-300 font-sans font-semibold text-[10px] transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-default disabled:active:scale-100"
            >
              <Square className="w-3 h-3 fill-current" /> Parar todos
            </button>
          </div>

          <div className="flex-1 min-h-0 grid grid-cols-3 grid-rows-3 gap-1.5 sm:gap-3 my-1">
            {sidePads.map(pad => renderPad(pad, true))}
          </div>
        </div>
      )}
    </div>
  );
};
