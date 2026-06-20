import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "pl.kroki.app",
  appName: "KROKI",
  webDir: "dist/client",
  server: {
    androidScheme: "https",
  },
  plugins: {
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#fffef8",
    },
  },
  android: {
    allowMixedContent: false,
    backgroundColor: "#fffef8",
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
};

export default config;
