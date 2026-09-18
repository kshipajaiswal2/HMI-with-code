const { app, BrowserWindow, shell, dialog } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');
const net = require('net');

// ROOT resolves correctly both in dev (repo checkout) and in a packaged install:
// electron-builder copies this whole project (unpacked, asar:false) into
// resources/app/, so __dirname is always <root>/electron in both cases.
const ROOT = path.join(__dirname, '..');

let serverProcess = null;
let ownsServer = false;
let listenPort = Number(process.env.PORT) || 8080;
let serverReady = false;
const windows = { studio: null, runtime: null };
const pendingLaunches = [];

function parseLaunchMode(argv = process.argv) {
  const kiosk = argv.includes('--kiosk');
  const mode = argv.includes('--runtime') ? 'runtime' : 'studio';
  return { mode, kiosk };
}

function configurePackagedUserData() {
  if (!app.isPackaged) return;
  const desired = path.join(app.getPath('appData'), 'Plant HMI');
  const legacy = path.join(app.getPath('appData'), 'plant-hmi');
  try {
    if (!fs.existsSync(desired) && fs.existsSync(legacy)) {
      fs.renameSync(legacy, desired);
    }
  } catch (err) {
    console.warn('Could not migrate user data folder:', err.message);
  }
  app.setPath('userData', desired);
}

configurePackagedUserData();

function logPath() {
  try {
    return path.join(app.getPath('userData'), 'plant-hmi.log');
  } catch {
    return path.join(ROOT, 'plant-hmi.log');
  }
}

function logLine(message) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  try {
    fs.appendFileSync(logPath(), line);
  } catch {
    // ignore disk errors during early startup
  }
  console.log(message);
}

function isLocalHttpUrl(raw) {
  try {
    const parsed = new URL(raw);
    const host = parsed.hostname;
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:')
      && (host === '127.0.0.1' || host === 'localhost' || host === '::1');
  } catch {
    return false;
  }
}

function attachWindowOpenHandler(contents) {
  contents.setWindowOpenHandler(({ url: openUrl }) => {
    if (isLocalHttpUrl(openUrl)) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 1024,
          height: 768,
          minWidth: 640,
          minHeight: 480,
          autoHideMenuBar: true,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
          }
        }
      };
    }
    if (/^https?:/i.test(openUrl)) shell.openExternal(openUrl);
    return { action: 'deny' };
  });
}

const gotLock = app.requestSingleInstanceLock({
  mode: parseLaunchMode().mode,
  kiosk: parseLaunchMode().kiosk
});

if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, argv) => {
    const requested = parseLaunchMode(argv);
    logLine(`second-instance ${requested.mode} kiosk=${requested.kiosk}`);
    if (!serverReady) {
      pendingLaunches.push(requested);
      return;
    }
    createAppWindow(requested.mode, requested.kiosk);
  });
}

function resolveProjectsDir() {
  if (!app.isPackaged) return path.join(ROOT, 'projects');
  return path.join(app.getPath('userData'), 'projects');
}

function packagedAppVersion() {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version || '0';
  } catch {
    return '0';
  }
}

function refreshBundledOverview(src, dest) {
  let entries = [];
  try {
    entries = fs.readdirSync(src, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const from = path.join(src, entry.name, 'Gfx', '100_Overview.json');
    const toDir = path.join(dest, entry.name, 'Gfx');
    const to = path.join(toDir, '100_Overview.json');
    if (!fs.existsSync(from)) continue;
    fs.mkdirSync(toDir, { recursive: true });
    fs.copyFileSync(from, to);
  }
}

function seedPackagedProjects(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const version = packagedAppVersion();
  const marker = path.join(dest, '.seeded');
  const previous = fs.existsSync(marker) ? fs.readFileSync(marker, 'utf8').trim() : '';
  const firstSeed = !previous;
  fs.cpSync(src, dest, { recursive: true, force: firstSeed });
  if (!firstSeed && previous !== version) {
    refreshBundledOverview(src, dest);
  }
  fs.writeFileSync(marker, version, 'utf8');
}

function probePlantHmi(port) {
  return new Promise((resolve) => {
    const req = http.get({
      hostname: '127.0.0.1',
      port: Number(port) || 8080,
      path: '/api/runtime/status',
      timeout: 800
    }, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.on('error', () => resolve(false));
  });
}

function findListenPort(preferred) {
  return new Promise((resolve, reject) => {
    const tryListen = (port) => {
      const server = net.createServer();
      server.once('error', (err) => {
        if (Number(port) !== 0) tryListen(0);
        else reject(err);
      });
      // Must match server/index.js (0.0.0.0) and exclusive:true, otherwise Windows
      // reports 127.0.0.1:8080 free while Express then crashes with EADDRINUSE.
      server.listen({ port: Number(port) || 0, host: '0.0.0.0', exclusive: true }, () => {
        const actual = server.address().port;
        server.close(() => resolve(actual));
      });
    };
    tryListen(Number(preferred) || 8080);
  });
}

function startServer({ port, projectsDir }) {
  return new Promise((resolve, reject) => {
    const out = fs.createWriteStream(logPath(), { flags: 'a' });
    serverProcess = spawn(process.execPath, [path.join(ROOT, 'server', 'index.js')], {
      cwd: ROOT,
      env: {
        ...process.env,
        PORT: String(port),
        PLANTHMI_PROJECTS: projectsDir,
        ELECTRON_RUN_AS_NODE: '1'
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true
    });

    serverProcess.stdout.pipe(out);
    serverProcess.stderr.pipe(out);
    serverProcess.on('error', reject);
    serverProcess.on('exit', (code) => {
      if (code !== 0 && code !== null && !serverReady) {
        reject(new Error(`Server exited early with code ${code}`));
      }
    });

    let attempts = 0;
    const check = () => {
      http.get(`http://127.0.0.1:${port}/api/runtime/status`, (res) => {
        if (res.statusCode === 200) resolve();
        else retry();
      }).on('error', retry);
    };
    const retry = () => {
      if (++attempts > 40) reject(new Error(`Server failed to start (timed out waiting on port ${port})`));
      else setTimeout(check, 500);
    };
    setTimeout(check, 800);
  });
}

function focusWindow(win) {
  if (!win || win.isDestroyed()) return;
  if (win.isMinimized()) win.restore();
  win.show();
  win.moveTop();
  win.focus();
  if (process.platform === 'win32') {
    app.focus({ steal: true });
  }
}

function createAppWindow(mode, kiosk) {
  const key = mode === 'runtime' ? 'runtime' : 'studio';
  const existing = windows[key];
  if (existing && !existing.isDestroyed()) {
    if (key === 'runtime') {
      existing.setKiosk(Boolean(kiosk));
      existing.setFullScreen(Boolean(kiosk));
    }
    focusWindow(existing);
    return existing;
  }

  const win = new BrowserWindow({
    width: key === 'runtime' ? 1024 : 1280,
    height: key === 'runtime' ? 768 : 800,
    minWidth: key === 'runtime' ? 640 : 1024,
    minHeight: 480,
    title: key === 'runtime' ? (kiosk ? 'Plant HMI Kiosk' : 'Plant HMI Runtime') : 'Plant HMI Studio',
    icon: path.join(ROOT, 'build', 'icon.ico'),
    autoHideMenuBar: true,
    show: false,
    fullscreen: key === 'runtime' && Boolean(kiosk),
    kiosk: key === 'runtime' && Boolean(kiosk),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  windows[key] = win;
  attachWindowOpenHandler(win.webContents);

  const url = key === 'runtime'
    ? `http://127.0.0.1:${listenPort}/runtime.html`
    : `http://127.0.0.1:${listenPort}/studio.html`;

  win.once('ready-to-show', () => focusWindow(win));
  win.webContents.on('did-fail-load', (_event, code, desc, failUrl) => {
    logLine(`did-fail-load ${code} ${desc} ${failUrl}`);
    if (!win.isDestroyed()) {
      dialog.showErrorBox('Plant HMI failed to load', `${desc}\n\n${failUrl}`);
    }
  });
  win.on('closed', () => {
    windows[key] = null;
  });

  logLine(`open ${key} ${url}`);
  win.loadURL(url);
  return win;
}

function hasOpenWindows() {
  return Object.values(windows).some((win) => win && !win.isDestroyed());
}

if (gotLock) {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.planthmi.app');
  }

  app.on('web-contents-created', (_event, contents) => {
    attachWindowOpenHandler(contents);
    contents.on('did-create-window', (child) => {
      child.once('ready-to-show', () => focusWindow(child));
      if (!child.isVisible()) child.show();
    });
  });

  app.whenReady().then(async () => {
    const initial = parseLaunchMode();
    try {
      const projectsDir = resolveProjectsDir();
      if (app.isPackaged) seedPackagedProjects(path.join(ROOT, 'projects'), projectsDir);
      const preferredPort = Number(process.env.PORT) || 8080;
      if (await probePlantHmi(preferredPort)) {
        listenPort = preferredPort;
        logLine(`reusing Plant HMI already running on ${listenPort}`);
      } else {
        listenPort = await findListenPort(preferredPort);
        logLine(`starting server on ${listenPort} projects=${projectsDir}`);
        await startServer({ port: listenPort, projectsDir });
        ownsServer = true;
      }
      serverReady = true;
      createAppWindow(initial.mode, initial.kiosk);
      while (pendingLaunches.length) {
        const next = pendingLaunches.shift();
        createAppWindow(next.mode, next.kiosk);
      }
    } catch (err) {
      logLine(`Failed to start Plant HMI: ${err.message}`);
      dialog.showErrorBox(
        'Plant HMI failed to start',
        `The runtime server did not start.\n\n${err.message}\n\nIf another Plant HMI or npm start is using port 8080, close it in Task Manager and try again.\n\nLog: ${logPath()}`
      );
      app.quit();
    }
  });

  app.on('window-all-closed', () => {
    if (hasOpenWindows()) return;
    if (ownsServer && serverProcess) serverProcess.kill();
    if (process.platform !== 'darwin') app.quit();
  });

  app.on('before-quit', () => {
    if (ownsServer && serverProcess) serverProcess.kill();
  });
}
