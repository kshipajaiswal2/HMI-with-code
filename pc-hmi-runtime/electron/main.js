const { app, BrowserWindow, shell } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

const ROOT = path.join(__dirname, '..');
const PORT = process.env.PORT || 8080;
const MODE = process.argv.includes('--runtime') ? 'runtime' : 'studio';

let serverProcess = null;
let mainWindow = null;

function startServer() {
  return new Promise((resolve, reject) => {
    serverProcess = spawn('node', [path.join(ROOT, 'server', 'index.js')], {
      cwd: ROOT,
      env: { ...process.env, PORT: String(PORT) },
      stdio: 'inherit',
      windowsHide: true
    });

    serverProcess.on('error', reject);

    let attempts = 0;
    const check = () => {
      http.get(`http://127.0.0.1:${PORT}/api/runtime/status`, (res) => {
        if (res.statusCode === 200) resolve();
        else retry();
      }).on('error', retry);
    };
    const retry = () => {
      if (++attempts > 30) reject(new Error('Server failed to start'));
      else setTimeout(check, 500);
    };
    setTimeout(check, 800);
  });
}

function createWindow() {
  const url = MODE === 'runtime'
    ? `http://127.0.0.1:${PORT}/runtime.html`
    : `http://127.0.0.1:${PORT}/studio.html`;

  mainWindow = new BrowserWindow({
    width: MODE === 'runtime' ? 1024 : 1280,
    height: MODE === 'runtime' ? 768 : 800,
    minWidth: 1024,
    minHeight: 600,
    title: MODE === 'runtime' ? 'Plant HMI Runtime' : 'Plant HMI Studio',
    autoHideMenuBar: true,
    fullscreen: MODE === 'runtime' && process.argv.includes('--kiosk'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadURL(url);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(async () => {
  try {
    await startServer();
    createWindow();
  } catch (err) {
    console.error('Failed to start Plant HMI:', err.message);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (serverProcess) serverProcess.kill();
});
