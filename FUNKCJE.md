# KROKI 🇵🇱 — Funkcjonalności

## Główne funkcje

### 🚶 Liczenie kroków w czasie rzeczywistym
- Detekcja kroków przez akcelerometr (DeviceMotion API)
- Zaawansowany algorytm: bandpass filter + adaptive threshold + anti-bounce
- Tryb ręczny: +1 krok (tap), +10 kroków (przytrzymaj)
- Tryb demo: symulacja spaceru ~110 kr./min
- Wskaźnik regularności chodu (0-100%)
- Kadencja (kroki/min) z real-time detektora

### 🎯 Dzienny cel
- Edytowalny cel (domyślnie 10 000 kroków)
- Szybkie presety: 5k, 8k, 10k, 12k, 15k
- Pierścień postępu z animowanym gradientem biało-czerwonym
- Milestony 25%, 50%, 75% z toastami i wibracją
- Celebracja "POLSKA GÓRA!" z confetti na 100%

### 📊 Metryki
- Dystans (km) — bazowany na wzroście użytkownika
- Kalorie (szacunkowe)
- Czas aktywności (min)
- Tempo (kroki/min)
- Regularity bar (gradient zielony/żółty/czerwony)

---

## Historia i statystyki

### 📈 Strona Statystyk
- Łączne kroki (lifetime)
- Seria dni z celem
- Łączny dystans (km)
- Wykres słupkowy (7/14/30 dni) z Recharts
- Porównanie "Ten tydzień vs poprzedni" z % zmianą
- Wizualizacja tygodnia vs cel (progress bars)
- Heatmapa roczna (GitHub-style, 52 tygodni)

### 🏆 Odznaki i wyzwania
- System osiągnięć (automatyczne odblokowanie)
- 6 wyzwań tygodniowych/miesięcznych z progress barami
- Toast + wibracja + confetti na nowe odznaki

---

## Polski motyw 🇵🇱

### Kolory
- Light: biały tło (#fefefe), crimson red akcent (#dc143c)
- Dark: OLED czarny (#0d0d0d), czerwony akcent (#ef4444)
- Biało-czerwony gradient na pierścieniu postępu

### Elementy wizualne
- Flaga polska w headerze (biało-czerwony pasek)
- Logo biało-czerwone (jak flaga)
- Orzeł 🦅 watermark w tle pierścienia
- Confetti w kolorach flagi
- Polska-stripe na kartach (CSS utility)

### Polskie przysłowia i humor
- "Husaria nie siedziała na kanapie! ⚔️"
- "Więcej chodzisz niż Jagiełło pod Grunwaldem! 🗡"
- "Polak potrafi — nawet przed śniadaniem! 💪"
- Kontekstowe wg pory dnia (rano/południe/wieczór)

### Mood Avatar (zmienia się z progressem)
- 🛋️ Ziemniak mode (0%)
- 🥱 Dopiero się rozkręcam (<25%)
- 🚶 Normalka (<50%)
- 🏃 Machina! (<75%)
- 🦅 Orzeł Biały mode! (<100%)
- ⚔️ HUSARIA!!! (≥100%)

### Polskie porównania dystansu
- "Długość Złotych Tarasów!" (250m)
- "Most Poniatowskiego" (500m)
- "Trasa Królewska — Zamek → Łazienki!" (1km)
- "Wejście na Kasprowy Wierch!" (7.5km)
- "MARATON! Biało-czerwona legenda!" (42km)

### Lifetime milestones z polskimi miastami
- 10 km: "Jak z Centrum na Mokotów!"
- 42 km: "MARATON! Polska GÓRA! 🇵🇱"
- 100 km: "Jak z Warszawy do Radomia!"
- 200 km: "Kraków → Zakopane i z powrotem!"
- 1000 km: "Jak z Gdańska do Zakopanego!"

---

## Smart Features

### 🧠 Smart Insights
- Prognoza celu: "W tym tempie cel o ~16:30"
- Porównanie z wczoraj o tej samej porze
- Ostrzeżenie streak: "Jeszcze X kroków do serii!"
- Popołudniowy nudge: "Masz <30% celu — spacer!"
- Powyżej średniej tygodnia

### 🌙 Podsumowanie dnia
- Toast o 21:00: kroki, % celu, km
- Automatycznie raz dziennie

### 👑 Daily Record
- Banner "NOWY REKORD DNIA!" gdy bijesz best

### 📊 Quick Stats
- Link do statystyk z poziomu głównej strony
- Łącznie / dystans / seria w jednej linii

---

## Tryb w tle

### 📱 Background handling
- Estymacja kroków w tle (lastCadence × czas × 0.6)
- Banner "Kroki w tle!" z opcją dodaj/odrzuć
- Auto-reset detektora po powrocie z tła
- Sesja persystowana w sessionStorage (12h TTL)

### 🔒 Wake Lock
- Ekran nie gaśnie podczas aktywnej sesji
- Auto re-acquire po visibilitychange
- Re-request na focus event
- Informacja o stanie w BackgroundInfo panel

### ℹ️ Background Info
- Zielony/żółty indicator aktywności
- Rozwijalne wskazówki (jak działa tło w przeglądarce)
- "Trzymaj apkę na wierzchu dla najlepszych wyników"

---

## Ustawienia

### ⚙️ SettingsSheet (Drawer)
- Dzienny cel z presetami
- Wzrost / długość kroku (slider 140-210cm)
- Ekran aktywny (toggle)
- Dźwięki (toggle)
- Streak freeze status (1 dzień wolny/tydzień)
- Motyw: Auto / Jasny / Ciemny
- Eksport JSON
- Import JSON (merge z historią)
- Udostępnij (Web Share API / clipboard)
- Reset dzisiejszych kroków

### 🧊 Streak Freeze
- 1 dzień wolny na tydzień nie przerywa serii
- Status: "Gotowy" / "Użyty"
- Automatyczne użycie przy brakującym dniu

---

## PWA i offline

### 📲 Progressive Web App
- manifest.webmanifest z ikonami
- Service Worker (sw.js) z cache strategies
- Install prompt po 30s użycia
- Działa offline (cache-first dla assets)

### 📡 Offline
- Indicator "Offline — dane zapisują się lokalnie"
- Network-first dla nawigacji, cache fallback
- Wszystkie dane w localStorage

---

## UX / UI

### 🎬 Animacje
- Page transitions (blur + scale + fade)
- Staggered entrance na elementach
- Spring physics na interakcjach
- whileTap scale na każdym przycisku
- Floating emoji w onboardingu
- Pulse na pierścieniu przy kroku
- Glow effect przy 100% celu

### 📱 Mobile-first
- Safe area insets (notch, home bar)
- 44px min touch targets
- Backdrop blur na nav/header
- Reduced motion support
- Haptic feedback (Vibration API)
- Overscroll behavior: none

### ♿ Dostępność
- Focus-visible outlines
- aria-labels na wszystkich przyciskach
- aria-current na nawigacji
- aria-hidden na dekoracyjnych SVG
- Kontrast WCAG AA+

### 🎨 Design System
- Brutalistyczny styl (neobrutalism)
- brut-card, brut-border, brut-shadow utilities
- press animation (translate on active)
- Spójne border-radius (6px karty, rounded-xl przyciski)
- Font: Archivo Black (display) + Space Mono (mono)

---

## Techniczny stack

- **Framework:** TanStack Start + React 19
- **Routing:** TanStack Router (file-based)
- **Styling:** Tailwind CSS v4
- **Animacje:** Framer Motion 12
- **Wykresy:** Recharts
- **Drawer:** Vaul
- **Toasty:** Sonner
- **Build:** Vite 8
- **Deploy:** Vercel (SPA mode)
- **Dane:** localStorage (bez backendu)
