/**
 * Electron main process — NHL Connect Desktop
 *
 * In production we spin up a tiny in-process HTTP server that serves the
 * Vite-built `dist/` folder on a random local port (127.0.0.1).
 * This avoids ALL file:// / CORS / crossorigin issues that plague packaged
 * Electron apps when loading ES-module bundles from disk.
 */

const { app, BrowserWindow, shell, Menu, screen, globalShortcut } = require('electron');
const path   = require('path');
const http   = require('http');
const fs     = require('fs');
const url    = require('url');

const isDev = process.env.NODE_ENV === 'development';

// ── MIME types ────────────────────────────────────────────────────────────────
const MIME = {
  '.html'  : 'text/html; charset=utf-8',
  '.js'    : 'text/javascript; charset=utf-8',
  '.mjs'   : 'text/javascript; charset=utf-8',
  '.css'   : 'text/css; charset=utf-8',
  '.png'   : 'image/png',
  '.jpg'   : 'image/jpeg',
  '.jpeg'  : 'image/jpeg',
  '.gif'   : 'image/gif',
  '.svg'   : 'image/svg+xml',
  '.ico'   : 'image/x-icon',
  '.woff'  : 'font/woff',
  '.woff2' : 'font/woff2',
  '.ttf'   : 'font/ttf',
  '.json'  : 'application/json',
  '.webp'  : 'image/webp',
};

// ── Local HTTP server for the built Vite app ──────────────────────────────────
function startLocalServer(distPath) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      try {
        const parsed   = url.parse(req.url || '/');
        let   pathname = decodeURIComponent(parsed.pathname || '/');

        // Normalise root
        if (pathname === '/' || pathname === '') pathname = '/index.html';

        let filePath = path.join(distPath, pathname);

        // SPA fallback — serve index.html for any unknown route
        if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
          filePath = path.join(distPath, 'index.html');
        }

        const ext         = path.extname(filePath).toLowerCase();
        const contentType = MIME[ext] || 'application/octet-stream';

        const data = fs.readFileSync(filePath);
        res.writeHead(200, {
          'Content-Type'  : contentType,
          'Cache-Control' : 'no-cache',
          // Allow Convex WebSocket connection
          'Access-Control-Allow-Origin': '*',
        });
        res.end(data);
      } catch (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end(`Not found: ${req.url}`);
      }
    });

    // Listen on a random available port
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      console.log(`[NHL Connect] Local server: http://127.0.0.1:${port}`);
      resolve({ server, url: `http://127.0.0.1:${port}` });
    });
  });
}

// ── Resolve icon path ─────────────────────────────────────────────────────────
function resolveIcon() {
  const iconFile = process.platform === 'win32' ? 'logo.ico' : 'logo.png';
  const candidates = isDev
    ? [path.join(__dirname, '../public', iconFile)]
    : [
        path.join(process.resourcesPath, iconFile),
        path.join(app.getAppPath(), '..', iconFile),
        path.join(__dirname, '../public', iconFile),
      ];

  for (const c of candidates) {
    try { if (fs.existsSync(c)) return c; } catch {}
  }
  return undefined;
}

// ── Splash window ─────────────────────────────────────────────────────────────
function createSplash() {
  const splash = new BrowserWindow({
    width: 420, height: 320,
    transparent: true, frame: false,
    alwaysOnTop: true, resizable: false,
    skipTaskbar: true,
    webPreferences: { nodeIntegration: false },
  });
  splash.loadFile(path.join(__dirname, 'splash.html'));
  splash.center();
  return splash;
}

// ── Main window ───────────────────────────────────────────────────────────────
async function createWindow(splash) {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const iconPath = resolveIcon();

  const win = new BrowserWindow({
    width  : Math.min(1400, width),
    height : Math.min(900,  height),
    minWidth   : 1100,
    minHeight  : 700,
    backgroundColor: '#F8F9FC',
    icon: iconPath,
    webPreferences: {
      preload          : path.join(__dirname, 'preload.cjs'),
      contextIsolation : true,
      nodeIntegration  : false,
      webSecurity      : true,    // safe — we load via http://127.0.0.1
      backgroundThrottling: false,
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false,
  });

  // ── Load the app ────────────────────────────────────────────────────────────
  if (isDev) {
    await win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    const distPath = path.join(__dirname, '../dist');
    const { url: localUrl } = await startLocalServer(distPath);
    await win.loadURL(localUrl);
  }

  // ── Show after content ready ────────────────────────────────────────────────
  win.once('ready-to-show', () => {
    if (splash && !splash.isDestroyed()) splash.destroy();
    win.show();
    win.focus();
  });

  // ── Log renderer errors (always visible in production via F12) ──────────────
  win.webContents.on('did-fail-load', (_e, code, desc, url) => {
    console.error(`[NHL Connect] Failed to load (${code}): ${desc} — ${url}`);
  });

  win.webContents.on('render-process-gone', (_e, details) => {
    console.error('[NHL Connect] Renderer crashed:', details.reason);
  });

  // ── F12 toggles DevTools in any build ──────────────────────────────────────
  win.webContents.on('before-input-event', (_e, input) => {
    if (input.key === 'F12' && input.type === 'keyDown') {
      if (win.webContents.isDevToolsOpened()) {
        win.webContents.closeDevTools();
      } else {
        win.webContents.openDevTools({ mode: 'detach' });
      }
    }
  });

  // Open external links in system browser
  win.webContents.setWindowOpenHandler(({ url: href }) => {
    shell.openExternal(href);
    return { action: 'deny' };
  });

  Menu.setApplicationMenu(null);
  return win;
}

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  const splash = createSplash();
  await createWindow(splash);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(null);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
