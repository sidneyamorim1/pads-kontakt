// Funções que só existem no app instalado (Electron), expostas pelo electron/preload.cjs.
// No navegador (npm run dev) `desktop` é undefined e a interface esconde o que depende dele.

interface SamplerDesktop {
  getBackupFolder: () => Promise<string | null>;
  chooseBackupFolder: () => Promise<string | null>;
  clearBackupFolder: () => Promise<null>;
  writeBackup: (name: string, data: ArrayBuffer) => Promise<string>;
  chooseSavePath: (defaultName: string) => Promise<string | null>;
  writeFile: (filePath: string, data: ArrayBuffer) => Promise<string>;
}

export const desktop = (window as unknown as { samplerDesktop?: SamplerDesktop }).samplerDesktop;
