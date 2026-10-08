// Processo principal do Electron: abre o app React numa janela nativa (macOS e Windows).
const { app, BrowserWindow, session, shell, Menu } = require('electron');
const path = require('path');
const { registerBackupIpc } = require('./backup.cjs');

// Permissões que o app usa: Web MIDI (controlador USB).
const ALLOWED_PERMISSIONS = new Set(['midi', 'midiSysex']);

// Mantém a pasta de dados do nome antigo do app, para não perder presets e samples já salvos.
if (!app.commandLine.hasSwitch('user-data-dir')) {
  app.setPath('userData', path.join(app.getPath('appData'), 'Kontakt 12-Pad Sampler'));
}

// Uma cópia aberta por vez: duas usando a mesma pasta de dados podem estragar os presets salvos.
// Abrir de novo só traz a janela que já está aberta para a frente.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.focus();
  });
}

// Áudio deve tocar no primeiro clique/tecla/nota MIDI, sem exigir gesto prévio.
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 860,
    minWidth: 900,
    minHeight: 640,
    title: 'Sampler Studio',
    backgroundColor: '#0c0d10',
    titleBarStyle: 'default',
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.cjs'),
      // Mantém o áudio/MIDI responsivo mesmo com a janela em segundo plano.
      backgroundThrottling: false,
    },
  });

  win.once('ready-to-show', () => win.show());

  // Links externos abrem no navegador padrão, não dentro do app.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    win.loadURL(devUrl);
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  registerBackupIpc();
  const ses = session.defaultSession;
  ses.setPermissionRequestHandler((_wc, permission, callback) => {
    callback(ALLOWED_PERMISSIONS.has(permission));
  });
  // 'media' e 'speaker-selection' só na verificação: mostram o nome das placas/saídas de áudio
  // e permitem escolher a saída. O microfone continua bloqueado (não está no RequestHandler).
  ses.setPermissionCheckHandler((_wc, permission) =>
    ALLOWED_PERMISSIONS.has(permission) || permission === 'media' || permission === 'speaker-selection');

  // Menu padrão (Copiar/Colar, Fechar, Sair). No macOS o primeiro menu é o do app; no Windows, "Arquivo".
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { role: process.platform === 'darwin' ? 'appMenu' : 'fileMenu' },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' },
  ]));

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
