import React, { useState, useEffect } from 'react';
import { X, Radio, CheckCircle2, Zap, Sparkles } from 'lucide-react';
import { PadData } from '../utils/audioEngine';

interface MidiWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  pads: PadData[];
  onUpdatePad: (updatedPad: PadData) => void;
  lastMidiEvent: { type: 'note' | 'cc'; val: number; ch: number } | null;
}

export const MidiWizardModal: React.FC<MidiWizardModalProps> = ({
  isOpen,
  onClose,
  pads,
  onUpdatePad,
  lastMidiEvent
}) => {
  const [currentStepPadId, setCurrentStepPadId] = useState<number>(1);
  const [mappedCount, setMappedCount] = useState<number>(0);

  // When a new MIDI event comes in while wizard is open, bind it to currentStepPadId!
  useEffect(() => {
    if (!isOpen || !lastMidiEvent) return;

    const targetPad = pads.find(p => p.id === currentStepPadId);
    if (targetPad) {
      onUpdatePad({
        ...targetPad,
        midiNote: lastMidiEvent.val,
        midiType: lastMidiEvent.type
      });

      if (currentStepPadId < 8) {
        setCurrentStepPadId(prev => prev + 1);
        setMappedCount(prev => prev + 1);
      } else {
        setMappedCount(8);
      }
    }
  }, [lastMidiEvent, isOpen]);

  if (!isOpen) return null;

  const currentPad = pads.find(p => p.id === currentStepPadId) || pads[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#12141a] border border-amber-500/40 rounded-2xl w-full max-w-xl flex flex-col shadow-2xl shadow-amber-500/10 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-black font-bold shadow-lg shadow-amber-500/20">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Assistente de Calibração dos Pads MIDI</h3>
              <p className="text-xs text-amber-400 font-mono">Pareamento Automático em 8 Toques</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-900 h-2">
          <div
            className="bg-gradient-to-r from-amber-500 to-cyan-400 h-full transition-all duration-300"
            style={{ width: `${(mappedCount / 8) * 100}%` }}
          />
        </div>

        {/* Body Step */}
        <div className="p-8 flex flex-col items-center text-center space-y-6">
          {mappedCount < 8 ? (
            <>
              <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border-2 border-amber-500 flex flex-col items-center justify-center shadow-xl shadow-amber-500/20 animate-pulse">
                <span className="text-2xl font-bold font-mono text-amber-400">PAD {currentStepPadId}</span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">Toque Agora</span>
              </div>

              <div className="space-y-2">
                <h4 className="text-xl font-bold text-white">
                  Bata no <span className="text-amber-400 font-extrabold">PAD {currentStepPadId}</span> do seu Arturia
                </h4>
                <p className="text-sm text-gray-400">
                  Instrumento: <strong className="text-cyan-400">{currentPad.name}</strong>
                </p>
              </div>

              {/* Live Signal Indicator */}
              <div className="w-full bg-black/50 p-3 rounded-xl border border-white/10 flex items-center justify-between text-xs font-mono">
                <span className="text-gray-400 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400 animate-ping" /> Aguardando toque no controlador...
                </span>
                {lastMidiEvent && (
                  <span className="text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded border border-emerald-500/30">
                    Último: {lastMidiEvent.type === 'cc' ? 'CC' : 'Nota'} {lastMidiEvent.val} (Ch {lastMidiEvent.ch})
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="py-6 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-2xl font-bold text-white">Calibração Concluída!</h4>
              <p className="text-sm text-gray-300">
                Todos os 8 pads do seu Arturia KeyLab foram pareados com sucesso.
              </p>
              <button
                onClick={onClose}
                className="mt-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-black font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-lg cursor-pointer"
              >
                Concluir e Tocar
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-black/40 border-t border-white/10 flex justify-between items-center text-xs text-gray-400 font-mono">
          <span>Passo {currentStepPadId} de 8</span>
          <button
            onClick={() => {
              if (currentStepPadId < 8) setCurrentStepPadId(prev => prev + 1);
            }}
            className="text-amber-400 hover:underline"
          >
            Pular Pad {currentStepPadId} &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
