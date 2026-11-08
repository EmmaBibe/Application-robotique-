// Application de bureau : fenêtre Electron qui sert l'application web embarquée.
const { app, BrowserWindow, protocol, net, shell } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');

// Schéma « app:// » traité comme un site sécurisé : modules JavaScript et stockage local fonctionnent.
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } }]);

const WEB = path.join(__dirname, 'www');
app.userAgentFallback = `${app.userAgentFallback} RoboMasterApp`;

function createWindow() {
  const win = new BrowserWindow({
    width: 1360, height: 880, minWidth: 380, minHeight: 500,
    backgroundColor: '#0b1220',
    title: 'RoboMaster',
    icon: path.join(WEB, 'assets/icons/icon-512.png'),
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, sandbox: true },
  });
  win.loadURL('app://robomaster/index.html');
  // les liens externes s'ouvrent dans le navigateur
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('app://')) { e.preventDefault(); shell.openExternal(url); } });
}

app.whenReady().then(() => {
  protocol.handle('app', req => {
    const { pathname } = new URL(req.url);
    const file = path.normalize(path.join(WEB, decodeURIComponent(pathname)));
    if (!file.startsWith(WEB)) return new Response('Interdit', { status: 403 });
    return net.fetch(pathToFileURL(file).toString());
  });
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
