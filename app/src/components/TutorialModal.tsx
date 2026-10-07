import React from 'react';
import { X, CheckCircle2, Layers, Cpu, Music, Radio, SlidersHorizontal } from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#14161d] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Guia de Instalação no Native Instruments Kontakt</h3>
              <p className="text-xs text-gray-400 font-mono">Como criar sua biblioteca de 8 Pads passo a passo</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tutorial Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-sm text-gray-300">
          {/* Step 1 */}
          <div className="flex gap-4 items-start bg-black/30 p-4 rounded-xl border border-white/5">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-black font-bold flex items-center justify-center flex-shrink-0 font-mono">
              1
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" /> Criar um Novo Instrumento no Kontakt
              </h4>
              <p className="text-gray-300 text-xs leading-relaxed">
                Abra o Kontakt (versão 5, 6 ou 7). No menu superior, vá em <span className="text-amber-400 font-mono font-semibold">Files &gt; New Instrument</span>. 
                Em seguida, clique no ícone da <strong>Chave Inglesa (Wrench Icon)</strong> no canto superior esquerdo do instrumento para entrar no modo de edição.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4 items-start bg-black/30 p-4 rounded-xl border border-white/5">
            <div className="w-8 h-8 rounded-full bg-cyan-500 text-black font-bold flex items-center justify-center flex-shrink-0 font-mono">
              2
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-white flex items-center gap-2">
                <Music className="w-4 h-4 text-cyan-400" /> Mapear os 8 Arquivos de Áudio (Mapping Editor)
              </h4>
              <p className="text-gray-300 text-xs leading-relaxed">
                Clique no botão <span className="text-cyan-400 font-mono font-semibold">Mapping Editor</span>. 
                Arraste seus 8 arquivos de áudio (.WAV ou .AIF) para as notas MIDI do teclado virtual:
              </p>
              <div className="bg-black/50 p-2.5 rounded border border-white/5 font-mono text-[11px] text-cyan-300 mt-2">
                Pad 1 = C1 (36) | Pad 2 = C#1 (37) | Pad 3 = D1 (38) | Pad 4 = D#1 (39)<br/>
                Pad 5 = E1 (40) | Pad 6 = F1 (41)  | Pad 7 = F#1 (42)| Pad 8 = G1 (43)
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4 items-start bg-black/30 p-4 rounded-xl border border-white/5">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-black font-bold flex items-center justify-center flex-shrink-0 font-mono">
              3
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" /> Inserir o Script KSP Gerado
              </h4>
              <p className="text-gray-300 text-xs leading-relaxed">
                Clique no botão <span className="text-emerald-400 font-mono font-semibold">Script Editor</span> no Kontakt, clique em <strong>Edit</strong>, cole o código KSP copiado deste aplicativo e clique no botão <strong>Apply</strong>. 
                Sua interface personalizada com os 8 pads surgirá instantaneamente na tela do Kontakt!
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-4 items-start bg-black/30 p-4 rounded-xl border border-white/5">
            <div className="w-8 h-8 rounded-full bg-purple-500 text-white font-bold flex items-center justify-center flex-shrink-0 font-mono">
              4
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-purple-400" /> Salvar como NKI ou Biblioteca
              </h4>
              <p className="text-gray-300 text-xs leading-relaxed">
                No Kontakt, clique no ícone de disquete e selecione <span className="text-purple-300 font-mono font-semibold">Save As...</span> para salvar seu novo instrumento como um arquivo <strong>.nki</strong> ou em uma pasta de biblioteca para carregar em qualquer projeto de DAW (Reaper, Ableton, Logic, Cubase, FL Studio)!
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-black/40 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-black font-bold px-5 py-2 rounded-lg text-sm transition-all cursor-pointer shadow-md shadow-orange-500/20"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Entendi, tudo pronto!</span>
          </button>
        </div>
      </div>
    </div>
  );
};
