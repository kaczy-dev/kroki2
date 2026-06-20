/**
 * KROKI Desktop — Preload Script (Sandboxed)
 * 
 * OWASP: Minimal surface area. Only expose what's absolutely needed.
 * Context isolation ensures renderer cannot access Node.js APIs.
 */

const { contextBridge } = require("electron");

// Freeze exposed API to prevent prototype pollution
const api = Object.freeze({
  platform: process.platform,
  isDesktop: true,
  // No other APIs exposed — renderer uses standard Web APIs only
});

contextBridge.exposeInMainWorld("electronAPI", api);
