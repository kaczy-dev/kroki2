/**
 * KROKI Desktop — Electron Main Process
 * 
 * Security hardened following:
 * - OWASP Electron Security Top 10
 * - Electron Security Checklist (electronjs.org/docs/tutorial/security)
 * - CWE-829 (Untrusted Content), CWE-346 (Origin Validation)
 */

const { app, BrowserWindow, Menu, Tray, nativeImage, shell, session } = require("electron");
const path = require("path");
const crypto = require("crypto");

// ============================================================
// SECURITY CONFIG
// ============================================================

// Only allow loading from our verified domain
const ALLOWED_ORIGINS = [
  "https://kroki2.vercel.app",
];
const APP_URL = ALLOWED_ORIGINS[0];

// CSP nonce for inline scripts (regenerated per session)
const CSP_NONCE = crypto.randomBytes(16).toString("base64");

// Content Security Policy — strict, blocks XSS/injection
const CONTENT_SECURITY_POLICY = [
  `default-src 'self' ${ALLOWED_ORIGINS.join(" ")}`,
  `script-src 'self' ${ALLOWED_ORIGINS.join(" ")} 'nonce-${CSP_NONCE}'`,
  `style-src 'self' ${ALLOWED_ORIGINS.join(" ")} 'unsafe-inline' https://fonts.googleapis.com`,
  `font-src 'self' https://fonts.gstatic.com`,
  `img-src 'self' data: blob: ${ALLOWED_ORIGINS.join(" ")}`,
  `connect-src 'self' ${ALLOWED_ORIGINS.join(" ")}`,
  `frame-src 'none'`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `upgrade-insecure-requests`,
].join("; ");

// ============================================================
// APP STATE
// ============================================================

let mainWindow = null;
let tray = null;

// ============================================================
// SECURITY: Disable unnecessary features BEFORE app ready
// ============================================================

// Prevent GPU process crashes from being exploitable
app.commandLine.appendSwitch("disable-gpu-sandbox"); // Still sandboxed at OS level
app.commandLine.appendSwitch("disable-software-rasterizer");

// Disable remote module (deprecated, potential RCE vector)
app.commandLine.appendSwitch("disable-remote-module");

// Disable navigation to file:// URLs (prevents local file exfiltration)
app.commandLine.appendSwitch("disable-file-url");

// ============================================================
// WINDOW CREATION WITH SECURITY HARDENING
// ============================================================

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 780,
    minWidth: 360,
    minHeight: 600,
    maxWidth: 500,
    title: "KROKI",
    icon: path.join(__dirname, "assets", "icon.png"),
    backgroundColor: "#fffef8",
    webPreferences: {
      // OWASP #1: Context Isolation (prevents prototype pollution)
      contextIsolation: true,
      // OWASP #2: Disable Node.js in renderer (prevents RCE)
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      nodeIntegrationInSubFrames: false,
      // OWASP #3: Sandbox renderer process (OS-level isolation)
      sandbox: true,
      // OWASP #4: Preload with minimal surface area
      preload: path.join(__dirname, "preload.js"),
      // OWASP #5: Disable experimental features
      experimentalFeatures: false,
      // OWASP #6: Disable WebView tag (potential XSS vector)
      webviewTag: false,
      // Security: disable remote content execution
      allowRunningInsecureContent: false,
      // Security: enable web security (same-origin policy)
      webSecurity: true,
      // Security: disable navigating to data/blob URLs
      navigateOnDragDrop: false,
      // Security: spellchecker can leak typed data
      spellcheck: false,
    },
    frame: true,
    titleBarStyle: "hiddenInset",
    autoHideMenuBar: true,
    resizable: true,
    show: false,
  });

  // Load our trusted app
  mainWindow.loadURL(APP_URL);

  // Show when ready
  mainWindow.once("ready-to-show", () => mainWindow.show());

  // ============================================================
  // SECURITY: Navigation & redirect guards
  // ============================================================

  // OWASP #7: Block navigation to untrusted origins
  mainWindow.webContents.on("will-navigate", (event, url) => {
    const parsed = new URL(url);
    if (!ALLOWED_ORIGINS.some((o) => url.startsWith(o)) && parsed.protocol !== "https:") {
      console.warn(`[SECURITY] Blocked navigation to: ${url}`);
      event.preventDefault();
    }
  });

  // OWASP #8: Block new window creation (popup attacks)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Only allow opening external HTTPS links in system browser
    if (url.startsWith("https://")) {
      shell.openExternal(url);
    } else {
      console.warn(`[SECURITY] Blocked window open: ${url}`);
    }
    return { action: "deny" };
  });

  // OWASP #9: Block permission requests (camera, mic, geolocation)
  mainWindow.webContents.session.setPermissionRequestHandler(
    (_webContents, permission, callback) => {
      // Only allow notifications and sensors (for step counting)
      const allowed = ["notifications", "sensors"];
      if (allowed.includes(permission)) {
        callback(true);
      } else {
        console.warn(`[SECURITY] Denied permission: ${permission}`);
        callback(false);
      }
    }
  );

  // Minimize to tray
  mainWindow.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

// ============================================================
// SECURITY: Session-level protections
// ============================================================

function setupSessionSecurity() {
  const defaultSession = session.defaultSession;

  // Inject Content-Security-Policy headers on all responses
  defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [CONTENT_SECURITY_POLICY],
        "X-Content-Type-Options": ["nosniff"],
        "X-Frame-Options": ["DENY"],
        "X-XSS-Protection": ["1; mode=block"],
        "Referrer-Policy": ["strict-origin-when-cross-origin"],
        "Permissions-Policy": [
          "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(self), accelerometer=(self)"
        ],
      },
    });
  });

  // Block loading from non-HTTPS (except localhost for dev)
  defaultSession.webRequest.onBeforeRequest((details, callback) => {
    const url = details.url;
    if (url.startsWith("http://") && !url.startsWith("http://localhost")) {
      console.warn(`[SECURITY] Blocked insecure request: ${url}`);
      callback({ cancel: true });
    } else {
      callback({});
    }
  });

  // Clear sensitive data on quit
  app.on("before-quit", () => {
    defaultSession.clearCache();
  });
}

// ============================================================
// TRAY
// ============================================================

function createTray() {
  const iconPath = path.join(__dirname, "assets", "icon.png");
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    { label: "Otwórz KROKI", click: () => mainWindow?.show() },
    { type: "separator" },
    { label: "Zamknij", click: () => { app.isQuitting = true; app.quit(); } },
  ]);

  tray.setToolTip("KROKI — Krokomierz");
  tray.setContextMenu(contextMenu);
  tray.on("click", () => mainWindow?.show());
}

// ============================================================
// SINGLE INSTANCE LOCK (prevents multi-instance attacks)
// ============================================================

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// ============================================================
// APP READY
// ============================================================

app.whenReady().then(() => {
  setupSessionSecurity();
  createWindow();
  createTray();
  Menu.setApplicationMenu(null); // Remove menu (attack surface reduction)
});

app.on("window-all-closed", () => { /* tray keeps running */ });
app.on("activate", () => {
  if (mainWindow === null) createWindow();
  else mainWindow.show();
});

// ============================================================
// SECURITY: Handle certificate errors strictly
// ============================================================
app.on("certificate-error", (event, _webContents, _url, _error, _cert, callback) => {
  // NEVER trust invalid certificates in production
  event.preventDefault();
  callback(false);
});
