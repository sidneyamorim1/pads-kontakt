// Ponte entre a página e o processo principal: só expõe as funções de gravar presets em arquivo.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('samplerDesktop', {
  getBackupFolder: () => ipcRenderer.invoke('backup:get-folder'),
  chooseBackupFolder: () => ipcRenderer.invoke('backup:choose-folder'),
  clearBackupFolder: () => ipcRenderer.invoke('backup:clear-folder'),
  writeBackup: (name, data) => ipcRenderer.invoke('backup:write', name, data),
  chooseSavePath: (defaultName) => ipcRenderer.invoke('file:choose-save-path', defaultName),
  writeFile: (filePath, data) => ipcRenderer.invoke('file:write', filePath, data),
});
