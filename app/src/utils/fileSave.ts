import { desktop } from './desktop';

// "Salvar como…" com a janela de salvar do sistema:
// - app instalado (Electron): pela ponte do preload, que grava no caminho escolhido;
// - navegador (Chrome/Edge): pela File System Access API, que guarda um "handle" do arquivo escolhido.
// O preset fica ligado ao arquivo, e cada "Salvar" depois atualiza o mesmo arquivo.

// Parte da File System Access API que o app usa (nem toda versão do TypeScript traz esses tipos)
export interface SaveFileHandle {
  name: string;
  queryPermission?: (options: { mode: 'readwrite' }) => Promise<PermissionState>;
  requestPermission?: (options: { mode: 'readwrite' }) => Promise<PermissionState>;
  createWritable: () => Promise<{ write: (data: ArrayBuffer) => Promise<void>; close: () => Promise<void> }>;
}

type SavePicker = (options: {
  suggestedName: string;
  types: { description: string; accept: Record<string, string[]> }[];
}) => Promise<SaveFileHandle>;

const browserWindow = window as unknown as { showSaveFilePicker?: SavePicker };

export interface SaveTarget {
  filePath?: string;              // app instalado
  fileHandle?: SaveFileHandle;    // navegador
}

export const canChooseFile = !!desktop || !!browserWindow.showSaveFilePicker;

// Abre a janela do sistema. Devolve o nome do preset (nome do arquivo sem .sampler) e onde gravar, ou null se cancelar.
export async function chooseSaveTarget(suggestedName: string): Promise<(SaveTarget & { name: string }) | null> {
  const clean = (fileName: string) => fileName.replace(/\.sampler$/i, '');
  if (desktop) {
    const filePath = await desktop.chooseSavePath(suggestedName);
    return filePath ? { name: clean(filePath.split(/[\\/]/).pop() ?? 'Preset'), filePath } : null;
  }
  if (browserWindow.showSaveFilePicker) {
    try {
      const fileHandle = await browserWindow.showSaveFilePicker({
        suggestedName: `${suggestedName.replace(/[\\/:*?"<>|]/g, '-')}.sampler`,
        types: [{ description: 'Preset do Sampler Studio', accept: { 'application/octet-stream': ['.sampler'] } }],
      });
      return { name: clean(fileHandle.name), fileHandle };
    } catch (err) {
      if ((err as Error).name === 'AbortError') return null; // janela cancelada
      throw err;
    }
  }
  return null;
}

export async function writeSaveTarget(target: SaveTarget, data: ArrayBuffer) {
  if (target.filePath && desktop) {
    await desktop.writeFile(target.filePath, data);
    return;
  }
  const handle = target.fileHandle;
  if (!handle) return;
  // Depois de reabrir o navegador, ele pede de novo a permissão para gravar no arquivo
  if (handle.queryPermission && (await handle.queryPermission({ mode: 'readwrite' })) !== 'granted') {
    if ((await handle.requestPermission?.({ mode: 'readwrite' })) !== 'granted') throw new Error('Permissão para gravar negada');
  }
  const writable = await handle.createWritable();
  await writable.write(data);
  await writable.close();
}

// Texto para mostrar onde o preset está ligado (o navegador só informa o nome do arquivo)
export const saveTargetLabel = (target: SaveTarget) => target.filePath ?? target.fileHandle?.name;
