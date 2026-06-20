# KROKI Desktop 🖥️🇵🇱🍺

Wersja desktopowa krokomierza KROKI oparta na Electron.js.
Ładuje web-app z Vercel i opakowuje jako natywną aplikację Windows/Mac/Linux.

## Szybki start

```bash
# 1. Zainstaluj zależności
npm install

# 2. Uruchom w trybie dev
npm start
```

## Budowanie .exe (Windows)

```bash
# Najpierw wygeneruj ikonę:
# Otwórz generate-icon.html w przeglądarce, kliknij Generate, zapisz jako assets/icon.png

# Buduj instalator (NSIS)
npm run build:win

# Lub portable .exe (bez instalacji)
npm run build:portable
```

Gotowe pliki będą w folderze `release/`

## Funkcje wersji desktop

- 🖥️ Natywne okno 420x780 (proporcje mobile)
- 🔽 Minimalizacja do tray (aplikacja chodzi w tle)
- 🔄 Zawsze najnowsza wersja (ładuje z Vercel)
- 🚀 Single-instance (nie otworzysz 2x)
- 🔗 Linki otwierają się w przeglądarce
- 📦 Portable .exe lub instalator NSIS

## Wymagania do budowania

- Node.js 18+
- npm
- Windows 10+ (dla build:win)

## Struktura

```
desktop/
  main.js          — główny proces Electron
  preload.js       — bridge do renderer
  assets/
    icon.svg       — ikona źródłowa
    icon.png       — ikona 256x256 (wygeneruj z generate-icon.html)
  package.json     — zależności i konfiguracja buildera
  generate-icon.html — helper do generowania PNG
```

## Zmiana URL aplikacji

Jeśli chcesz ładować inny URL (np. localhost w dev), zmień `APP_URL` w `main.js`:

```js
const APP_URL = "http://localhost:5173"; // dev
// const APP_URL = "https://kroki2.vercel.app"; // production
```
