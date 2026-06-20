import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "pl.kroki.app",
  appName: "KROKI",
  webDir: "dist/client",
  server: {
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#fffef8",
      androidSplashResourceName: "splash",
      showSpinner: false,
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#fffef8",
    },
    KeepAwake: {
      // Prevents screen from sleeping during active step counting
    },
  },
  android: {
    allowMixedContent: false,
    backgroundColor: "#fffef8",
  },
};

export default config;
