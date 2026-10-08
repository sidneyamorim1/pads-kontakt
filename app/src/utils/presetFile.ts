import { StoredPad, StoredSample } from './presetStore';

// Arquivo .sampler: um ou mais presets junto com os áudios que eles usam, para levar de um computador
// para outro (Mac ⇄ Windows) ou guardar como backup.
//
// Formato: "SMPLSTD1" (8 bytes) + tamanho do cabeçalho (uint32) + cabeçalho JSON (UTF-8) + áudios em sequência.
// O cabeçalho diz onde cada áudio começa e quantos bytes tem.

const MAGIC = 'SMPLSTD1';

export interface FilePreset {
  name: string;
  kitId: string;
  pads: StoredPad[];
}

interface FileHeader {
  app: 'Sampler Studio';
  version: 1;
  presets: FilePreset[];
  samples: { id: string; fileName: string; offset: number; length: number }[];
}

export function buildPresetFile(presets: FilePreset[], samples: StoredSample[]): Blob {
  let offset = 0;
  const header: FileHeader = {
    app: 'Sampler Studio',
    version: 1,
    presets,
    samples: samples.map(s => {
      const entry = { id: s.id, fileName: s.fileName, offset, length: s.data.byteLength };
      offset += s.data.byteLength;
      return entry;
    }),
  };
  const headerBytes = new TextEncoder().encode(JSON.stringify(header));
  const size = new DataView(new ArrayBuffer(4));
  size.setUint32(0, headerBytes.byteLength);
  return new Blob([MAGIC, size, headerBytes, ...samples.map(s => s.data)], { type: 'application/octet-stream' });
}

export async function readPresetFile(file: Blob): Promise<{ presets: FilePreset[]; samples: StoredSample[] }> {
  const data = await file.arrayBuffer();
  const invalid = new Error('Arquivo .sampler inválido');
  if (data.byteLength < 12 || new TextDecoder().decode(data.slice(0, 8)) !== MAGIC) throw invalid;
  const headerLength = new DataView(data).getUint32(8);
  const start = 12 + headerLength;
  if (start > data.byteLength) throw invalid;

  const header = JSON.parse(new TextDecoder().decode(data.slice(12, start))) as FileHeader;
  if (header.app !== 'Sampler Studio' || !Array.isArray(header.presets)) throw invalid;
  const samples = (header.samples ?? []).map(s => {
    if (start + s.offset + s.length > data.byteLength) throw invalid;
    return { id: s.id, fileName: s.fileName, data: data.slice(start + s.offset, start + s.offset + s.length) };
  });
  return { presets: header.presets, samples };
}
