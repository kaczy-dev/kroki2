# 🔒 KROKI — Security

## Zastosowane zabezpieczenia (OWASP Top 10 + Electron Security)

### Web App (Vercel)

| Header | Wartość | Chroni przed |
|--------|---------|--------------|
| `Strict-Transport-Security` | max-age=63072000; includeSubDomains; preload | Downgrade attacks (HSTS) |
| `X-Content-Type-Options` | nosniff | MIME sniffing attacks |
| `X-Frame-Options` | DENY | Clickjacking |
| `X-XSS-Protection` | 1; mode=block | Reflected XSS (legacy) |
| `Referrer-Policy` | strict-origin-when-cross-origin | Information leakage |
| `Permissions-Policy` | camera=(), mic=(), geo=()... | Unauthorized device access |
| `Cross-Origin-Opener-Policy` | same-origin | Spectre-type side-channel |
| `Cross-Origin-Resource-Policy` | same-origin | Cross-origin data theft |
| `Cross-Origin-Embedder-Policy` | credentialless | Cross-origin embedding |

### Service Worker
- `Cache-Control: no-cache, no-store` na `sw.js` (zawsze najnowsza wersja)
- Network-first dla nawigacji (nie serwuje stale cached content)
- Only caches same-origin requests
- Nie wykonuje żadnego kodu z cache bez weryfikacji

### Dane użytkownika
- **Brak backendu** — zero danych opuszcza urządzenie
- **localStorage only** — dane nigdy nie są wysyłane w sieć
- **Brak cookies** — zero tracking
- **Brak analytics** — zero telemetrii
- **Brak third-party scripts** — jedynie Google Fonts (CDN)

---

## Electron Desktop App

### OWASP Electron Security Top 10 — wszystkie zastosowane:

| # | Wymaganie | Status |
|---|-----------|--------|
| 1 | Context Isolation | ✅ `contextIsolation: true` |
| 2 | Disable Node.js in renderer | ✅ `nodeIntegration: false` |
| 3 | Enable Sandbox | ✅ `sandbox: true` |
| 4 | Minimal preload API | ✅ Only `platform` + `isDesktop` exposed |
| 5 | Disable experimental features | ✅ `experimentalFeatures: false` |
| 6 | Disable webview | ✅ `webviewTag: false` |
| 7 | Block untrusted navigation | ✅ `will-navigate` guard |
| 8 | Block popup windows | ✅ `setWindowOpenHandler` → deny |
| 9 | Permission request filtering | ✅ Only sensors + notifications allowed |
| 10 | Disable remote module | ✅ Command line switch |

### Dodatkowe zabezpieczenia:

- **CSP nonce** — per-session nonce dla inline scripts
- **Certificate pinning** — rejects invalid certs (`certificate-error` → false)
- **Single instance lock** — prevents multi-instance race conditions
- **Origin allowlist** — only `kroki2.vercel.app` can load
- **HTTP blocked** — all non-HTTPS requests cancelled
- **Permissions-Policy** — blocks camera, mic, geo, payment, USB
- **API surface frozen** — `Object.freeze()` on exposed API
- **Cache cleared on quit** — no sensitive data persists

### Czego NIE robimy (i dlaczego):
- ❌ Code signing — wymaga certyfikatu ($300+/rok). Portable .exe będzie flagowany przez Windows SmartScreen ale jest bezpieczny.
- ❌ Auto-update — app ładuje z Vercel więc jest zawsze aktualna bez mechanizmu update (zero attack surface)
- ❌ Native filesystem access — app nie czyta/pisze plików systemowych

---

## Threat Model

### Attack vectors i mitigation:

| Wektor | Mitigacja |
|--------|-----------|
| XSS (Cross-Site Scripting) | CSP, X-XSS-Protection, no inline scripts |
| MITM (Man-in-the-Middle) | HSTS, certificate validation, HTTPS-only |
| Clickjacking | X-Frame-Options: DENY, COOP |
| Supply chain (npm) | Minimal dependencies, lockfile, no postinstall |
| Local data theft | localStorage encrypted by OS user profile |
| Privilege escalation | Sandbox, no nodeIntegration, no remote |
| Prototype pollution | contextIsolation, Object.freeze |
| DNS rebinding | webSecurity: true, origin allowlist |

---

## Raportowanie vulnerabilities

Jeśli znajdziesz lukę bezpieczeństwa, zgłoś ją na:
- GitHub Issues (public) — dla non-critical
- Email (jeśli critical) — [dodaj email]

## Aktualizacje

- Electron: aktualizuj co minor version (security patches)
- Dependencies: `npm audit` co tydzień
- Vercel: auto-deploy z main branch
