import React, { useState } from 'react';
import { X, Copy, Download, Check, Code2, Terminal } from 'lucide-react';
import { generateKspScript, PadKspConfig } from '../utils/kspGenerator';

interface KspModalProps {
  isOpen: boolean;
  onClose: () => void;
  pads: PadKspConfig[];
}

export const KspModal: React.FC<KspModalProps> = ({ isOpen, onClose, pads }) => {
  const [copied, setCopied] = useState(false);
  const [instrumentName, setInstrumentName] = useState('Controlador 8 Pads');

  if (!isOpen) return null;

  const kspCode = generateKspScript(pads, instrumentName);

  const handleCopy = () => {
    navigator.clipboard.writeText(kspCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([kspCode], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${instrumentName.toLowerCase().replace(/\s+/g, '_')}_script.ksp`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121419] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Gerador de Script KSP para Kontakt</h3>
              <p className="text-xs text-gray-400 font-mono">Código nativo para colar no Editor de Script do Native Instruments Kontakt</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="px-6 py-3 bg-black/20 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Nome do Instrumento:</span>
            <input
              type="text"
              value={instrumentName}
              onChange={(e) => setInstrumentName(e.target.value)}
              className="bg-gray-900 border border-white/10 rounded px-2.5 py-1 text-white font-mono focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-black" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copiado!' : 'Copiar Código KSP'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-white font-medium px-3 py-1.5 rounded-lg border border-white/10 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Baixar Arquivo .ksp</span>
            </button>
          </div>
        </div>

        {/* Code Output */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-xs text-emerald-400 bg-[#0a0b0e] leading-relaxed select-all">
          <pre>{kspCode}</pre>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-black/40 border-t border-white/10 flex justify-between items-center text-xs text-gray-400 font-mono">
          <span className="flex items-center gap-1">
            <Terminal className="w-3.5 h-3.5 text-amber-500" /> Compatível com Kontakt 5, 6 e 7
          </span>
          <span>8 Pads Mapeados: Notas MIDI {pads[0]?.midiNote || 36} - {pads[pads.length - 1]?.midiNote || 43}</span>
        </div>
      </div>
    </div>
  );
};
