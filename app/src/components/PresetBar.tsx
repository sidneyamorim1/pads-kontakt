import React, { useRef, useState } from 'react';
import { Save, SaveAll, Trash2, Bookmark, Check, X, Download, FolderOpen, FolderSync } from 'lucide-react';
import { Preset } from '../utils/presetStore';
import { saveTargetLabel } from '../utils/fileSave';

interface PresetBarProps {
  presets: Preset[];
  activePresetId: string | null;
  dirty: boolean;
  onLoad: (id: string) => void;
  onSave: (name: string, overwriteId: string | null) => void;
  onDelete: (id: string) => void;
  onExport: () => void;
  // App instalado: "Salvar como…" abre a janela do sistema (no navegador, digita-se o nome aqui)
  onSaveAs?: () => void;
  onImport: (files: File[]) => void;
  // Pasta de cópia: undefined = indisponível (navegador); null = nenhuma escolhida
  backupFolder: string | null | undefined;
  onChooseBackup: () => void;
  onClearBackup: () => void;
}

export const PresetBar: React.FC<PresetBarProps> = ({ presets, activePresetId, dirty, onLoad, onSave, onDelete, onExport, onSaveAs, onImport, backupFolder, onChooseBackup, onClearBackup }) => {
  const importRef = useRef<HTMLInputElement>(null);
  // null = barra normal; string = digitando o nome de um preset novo
  const [newName, setNewName] = useState<string | null>(null);
  const active = presets.find(p => p.id === activePresetId) || null;

  const confirmNew = () => {
    const name = newName?.trim();
    if (!name) return;
    const existing = presets.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (existing && !window.confirm(`Já existe um preset "${existing.name}". Substituir?`)) return;
    onSave(name, existing ? existing.id : null);
    setNewName(null);
  };

  const btn = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div
      className="w-full flex flex-wrap items-center gap-2 glass-panel border border-white/10 rounded-xl px-3 py-2"
    >
      <Bookmark className="w-4 h-4 text-amber-500" />
      <span className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Preset:</span>

      {newName === null ? (
        <>
          <select
            value={activePresetId ?? ''}
            onChange={(e) => e.target.value && onLoad(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm font-medium focus:outline-none focus:border-amber-500 cursor-pointer min-w-[12rem]"
          >
            <option value="" className="bg-gray-900">{presets.length ? '— escolha um preset —' : '— nenhum preset salvo —'}</option>
            {presets.map(p => (
              <option key={p.id} value={p.id} className="bg-gray-900">{p.name}</option>
            ))}
          </select>
          {dirty && active && <span className="text-[10px] font-mono text-amber-400">• alterado</span>}

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              className={`${btn} bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25`}
              onClick={() => (active ? onSave(active.name, active.id) : onSaveAs ? onSaveAs() : setNewName(''))}
              title={active
                ? `Salvar alterações em "${active.name}"${saveTargetLabel(active) ? `\nArquivo: ${saveTargetLabel(active)}` : ''}`
                : 'Salvar como novo preset'}
            >
              <Save className="w-3.5 h-3.5" /> Salvar
            </button>
            <button
              type="button"
              className={`${btn} bg-gray-800 border-white/10 text-gray-200 hover:bg-gray-700`}
              onClick={() => (onSaveAs ? onSaveAs() : setNewName(active ? `${active.name.replace(/( \(cópia\))+$/, '')} (cópia)` : ''))}
              title={onSaveAs ? 'Escolher onde salvar o arquivo .sampler deste preset' : undefined}
            >
              <SaveAll className="w-3.5 h-3.5" /> Salvar como…
            </button>
            <button
              type="button"
              disabled={!active}
              className={`${btn} bg-gray-800 border-white/10 text-red-300 hover:bg-red-950/60`}
              onClick={() => active && window.confirm(`Excluir o preset "${active.name}"?`) && onDelete(active.id)}
            >
              <Trash2 className="w-3.5 h-3.5" /> Excluir
            </button>

            <span className="w-px h-5 bg-white/10" />
            <button
              type="button"
              className={`${btn} bg-gray-800 border-white/10 text-gray-200 hover:bg-gray-700`}
              onClick={onExport}
              title="Salvar o que está na tela, com os áudios, num arquivo .sampler (para outro computador ou backup)"
            >
              <Download className="w-3.5 h-3.5" /> Exportar
            </button>
            <button
              type="button"
              className={`${btn} bg-gray-800 border-white/10 text-gray-200 hover:bg-gray-700`}
              onClick={() => importRef.current?.click()}
              title="Abrir um arquivo .sampler e adicionar os presets dele"
            >
              <FolderOpen className="w-3.5 h-3.5" /> Importar
            </button>
            {backupFolder !== undefined && (
              <div className="flex items-center">
                <button
                  type="button"
                  className={`${btn} max-w-[15rem] ${backupFolder
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20'
                    : 'bg-gray-800 border-white/10 text-gray-200 hover:bg-gray-700'} ${backupFolder ? 'rounded-r-none' : ''}`}
                  onClick={onChooseBackup}
                  title={backupFolder
                    ? `Ao salvar, uma cópia .sampler também vai para:\n${backupFolder}\n\nClique para trocar a pasta.`
                    : 'Escolher uma pasta (Dropbox, iCloud, pendrive…) onde cada preset salvo também é gravado como .sampler'}
                >
                  <FolderSync className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{backupFolder ? `Cópia: ${backupFolder.split(/[\\/]/).pop()}` : 'Pasta de cópia…'}</span>
                </button>
                {backupFolder && (
                  <button
                    type="button"
                    title="Parar de gravar cópias"
                    onClick={() => window.confirm('Parar de gravar uma cópia dos presets nesta pasta? Os arquivos que já estão lá continuam.') && onClearBackup()}
                    className={`${btn} rounded-l-none border-l-0 bg-emerald-500/10 border-emerald-500/40 text-emerald-300 hover:bg-red-950/60 hover:text-red-300`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
            <input
              ref={importRef}
              type="file"
              accept=".sampler"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                e.target.value = '';
                if (files.length) onImport(files);
              }}
            />
          </div>
        </>
      ) : (
        <>
          <input
            autoFocus
            type="text"
            value={newName}
            placeholder="Nome do preset"
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') confirmNew();
              if (e.key === 'Escape') setNewName(null);
            }}
            className="flex-1 min-w-[12rem] bg-black/60 border border-amber-500/50 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-amber-500"
          />
          <button type="button" disabled={!newName.trim()} onClick={confirmNew}
            className={`${btn} bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30`}>
            <Check className="w-3.5 h-3.5" /> Salvar
          </button>
          <button type="button" onClick={() => setNewName(null)}
            className={`${btn} bg-gray-800 border-white/10 text-gray-300 hover:bg-gray-700`}>
            <X className="w-3.5 h-3.5" /> Cancelar
          </button>
        </>
      )}
    </div>
  );
};
