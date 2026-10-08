// Arquivos .sampler gravados pelo app:
// - "Salvar como…": a janela do sistema escolhe onde salvar; o preset fica ligado a esse arquivo.
// - Pasta de cópia: ao salvar um preset, o app também grava um .sampler numa pasta escolhida (Dropbox, pendrive…).
// A página só pode gravar onde o usuário escolheu numa janela do sistema: a pasta de cópia e os arquivos
// do "Salvar como…" ficam registrados aqui no processo principal.
const { app, dialog, ipcMain, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const configFile = () => path.join(app.getPath('userData'), 'backup-folder.json');

function getFolder() {
  try {
    return JSON.parse(fs.readFileSync(configFile(), 'utf8')).folder || null;
  } catch {
    return null;
  }
}

function setFolder(folder) {
  fs.writeFileSync(configFile(), JSON.stringify({ folder }));
}

// Arquivos escolhidos no "Salvar como…" (e a última pasta usada nele)
const savedFilesFile = () => path.join(app.getPath('userData'), 'saved-files.json');

function getSavedFiles() {
  try {
    const data = JSON.parse(fs.readFileSync(savedFilesFile(), 'utf8'));
    return { files: data.files || [], lastDir: data.lastDir || null };
  } catch {
    return { files: [], lastDir: null };
  }
}

function addSavedFile(filePath) {
  const data = getSavedFiles();
  if (!data.files.includes(filePath)) data.files.push(filePath);
  data.lastDir = path.dirname(filePath);
  fs.writeFileSync(savedFilesFile(), JSON.stringify(data));
}

function registerBackupIpc() {
  ipcMain.handle('backup:get-folder', () => getFolder());

  ipcMain.handle('backup:choose-folder', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showOpenDialog(win, {
      title: 'Pasta para as cópias dos presets',
      buttonLabel: 'Usar esta pasta',
      defaultPath: getFolder() || app.getPath('documents'),
      properties: ['openDirectory', 'createDirectory'],
    });
    if (result.canceled || !result.filePaths[0]) return getFolder();
    setFolder(result.filePaths[0]);
    return result.filePaths[0];
  });

  ipcMain.handle('backup:clear-folder', () => {
    setFolder(null);
    return null;
  });

  // Janela "Salvar como" do sistema: devolve o caminho escolhido (sempre .sampler) ou null se cancelar
  ipcMain.handle('file:choose-save-path', async (event, defaultName) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const dir = getSavedFiles().lastDir || getFolder() || app.getPath('documents');
    const safeName = String(defaultName || 'Preset').replace(/[\\/:*?"<>|]/g, '-').trim() || 'Preset';
    const result = await dialog.showSaveDialog(win, {
      title: 'Salvar preset',
      buttonLabel: 'Salvar',
      defaultPath: path.join(dir, `${safeName}.sampler`),
      filters: [{ name: 'Preset do Sampler Studio', extensions: ['sampler'] }],
      properties: ['createDirectory', 'showOverwriteConfirmation'],
    });
    if (result.canceled || !result.filePath) return null;
    const filePath = /\.sampler$/i.test(result.filePath) ? result.filePath : `${result.filePath}.sampler`;
    addSavedFile(filePath);
    return filePath;
  });

  // Grava num arquivo escolhido antes pelo "Salvar como…"
  ipcMain.handle('file:write', async (_event, filePath, data) => {
    if (!getSavedFiles().files.includes(filePath)) throw new Error('Arquivo não escolhido pelo usuário');
    await fs.promises.writeFile(filePath, Buffer.from(data));
    return filePath;
  });

  // Grava `<nome>.sampler` na pasta de cópia (substitui o arquivo anterior do mesmo preset)
  ipcMain.handle('backup:write', async (_event, name, data) => {
    const folder = getFolder();
    if (!folder) throw new Error('Nenhuma pasta de cópia escolhida');
    const fileName = `${String(name).replace(/[\\/:*?"<>|]/g, '-').trim() || 'Preset'}.sampler`;
    const target = path.join(folder, path.basename(fileName));
    await fs.promises.writeFile(target, Buffer.from(data));
    return target;
  });
}

module.exports = { registerBackupIpc };
