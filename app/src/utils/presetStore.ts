import { PadData } from './audioEngine';

// Armazenamento local (IndexedDB) dos presets e dos arquivos de áudio carregados nos pads.
// Os samples são guardados uma única vez e referenciados pelos presets via `customSampleId`.

export type StoredPad = Omit<PadData, 'customBuffer'>;

export interface Preset {
  id: string;
  name: string;
  kitId: string;
  pads: StoredPad[];
  updatedAt: number;
  activePresetId?: string | null; // só na sessão: qual preset estava aberto
}

export interface StoredSample {
  id: string;
  fileName: string;
  data: ArrayBuffer;
}

// Sessão atual, salva automaticamente para o app reabrir do jeito que foi fechado.
export const SESSION_ID = '__session__';

const DB_NAME = 'kontakt-12pad';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('presets')) db.createObjectStore('presets', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('samples')) db.createObjectStore('samples', { keyPath: 'id' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

function run<T>(store: 'presets' | 'samples', mode: IDBTransactionMode, op: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  return openDb().then(db => new Promise<T>((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const req = op(tx.objectStore(store));
    tx.oncomplete = () => resolve(req.result as T);
    tx.onerror = () => reject(tx.error);
  }));
}

export function toStoredPads(pads: PadData[]): StoredPad[] {
  return pads.map(({ customBuffer, ...rest }) => rest);
}

export const presetStore = {
  listPresets: async (): Promise<Preset[]> => {
    const all = await run<Preset[]>('presets', 'readonly', s => s.getAll());
    return all.filter(p => p.id !== SESSION_ID).sort((a, b) => a.name.localeCompare(b.name));
  },

  getPreset: (id: string) => run<Preset | undefined>('presets', 'readonly', s => s.get(id)),

  putPreset: (preset: Preset) => run<IDBValidKey>('presets', 'readwrite', s => s.put(preset)),

  deletePreset: async (id: string) => {
    await run('presets', 'readwrite', s => s.delete(id));
    await presetStore.pruneSamples();
  },

  getSample: (id: string) => run<StoredSample | undefined>('samples', 'readonly', s => s.get(id)),

  putSample: (sample: StoredSample) => run<IDBValidKey>('samples', 'readwrite', s => s.put(sample)),

  // Apaga samples que nenhum preset (nem a sessão atual) usa mais.
  pruneSamples: async () => {
    const presets = await run<Preset[]>('presets', 'readonly', s => s.getAll());
    const used = new Set(presets.flatMap(p => p.pads.map(pad => pad.customSampleId).filter(Boolean)));
    const keys = await run<IDBValidKey[]>('samples', 'readonly', s => s.getAllKeys());
    for (const key of keys) {
      if (!used.has(key as string)) await run('samples', 'readwrite', s => s.delete(key));
    }
  },
};
