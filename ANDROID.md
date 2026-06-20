# 📱 KROKI — Konwersja na Android (Capacitor)

## Wymagania

- Node.js 18+
- Android Studio (Arctic Fox+)
- JDK 17
- Android SDK (API 33+)

## Setup (jednorazowy)

```bash
# 1. Zainstaluj Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android
npm install @capacitor/status-bar @capacitor/splash-screen @capacitor/keep-awake

# 2. Inicjalizuj projekt Android
npx cap add android

# 3. Zbuduj web app i zsynchronizuj
npm run android:sync
```

## Codzienne komendy

```bash
# Buduj i synchronizuj z Androidem
npm run android:sync

# Otwórz w Android Studio
npm run android:open

# Buduj + uruchom na podłączonym urządzeniu/emulatorze
npm run android:run
```

## Konfiguracja natywna

### Uprawnienia (android/app/src/main/AndroidManifest.xml)
Dodaj przed `<application>`:
```xml
<uses-permission android:name="android.permission.ACTIVITY_RECOGNITION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
```

### Sensor w tle (Foreground Service)
Aby kroki liczyły się w tle na Android:
1. Dodaj Foreground Service w AndroidManifest
2. Użyj `@capacitor/background-runner` lub natywnego kodu Java/Kotlin
3. Zarejestruj `SensorManager.getDefaultSensor(Sensor.TYPE_STEP_DETECTOR)`

### Ikony
Wygeneruj ikony z `public/icon-512.svg`:
```bash
npx capacitor-assets generate --iconBackgroundColor '#fffef8' --iconBackgroundColorDark '#0e0c0a'
```

## Struktura po inicjalizacji

```
android/
  app/
    src/main/
      java/pl/kroki/app/  ← natywny kod
      res/                  ← zasoby (ikony, splash)
      AndroidManifest.xml
    build.gradle
```

## Alternatywa: TWA (Trusted Web Activity)

Jeśli nie potrzebujesz natywnego sensora w tle, możesz użyć TWA:

```bash
# Bubblewrap — generuje APK z PWA
npm install -g @nicolo-ribaudo/bubblewrap
bubblewrap init --manifest https://kroki2.vercel.app/manifest.webmanifest
bubblewrap build
```

TWA:
- ✅ Prostsze (zero kodu natywnego)
- ✅ Auto-update z web deploy
- ❌ Brak dostępu do natywnego step sensor w tle
- ❌ Ograniczone background execution

## Podpisanie APK (release)

```bash
# Wygeneruj keystore (jednorazowo)
keytool -genkey -v -keystore kroki-release.keystore -alias kroki -keyalg RSA -keysize 2048 -validity 10000

# Zbuduj release APK
cd android
./gradlew assembleRelease
```

APK będzie w: `android/app/build/outputs/apk/release/`

## Publikacja na Google Play

1. Utwórz konto deweloperskie ($25)
2. Google Play Console → Nowa aplikacja
3. Prześlij AAB: `./gradlew bundleRelease`
4. Wypełnij opis, ikony, screenshots
5. Opublikuj w ścieżce "Internal testing" najpierw
