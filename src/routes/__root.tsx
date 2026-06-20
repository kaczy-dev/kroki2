import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { StepProvider } from "@/context/StepProvider";
import { BottomNav } from "@/components/BottomNav";
import { Toaster } from "sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl text-accent">404</h1>
        <h2 className="mt-4 font-display text-xl text-ink">Nie znaleziono strony</h2>
        <p className="mt-2 text-sm font-mono text-muted">
          Strona, której szukasz, nie istnieje lub została przeniesiona.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="brut-border brut-shadow press bg-accent text-surface font-display px-5 py-2.5 text-sm inline-block"
          >
            Wróć do głównej
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    console.error("[KROKI] Render error:", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl text-ink">
          Coś poszło nie tak
        </h1>
        <p className="mt-2 text-sm font-mono text-muted">
          Spróbuj odświeżyć stronę lub wróć na stronę główną.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="brut-border brut-shadow press bg-accent text-surface font-display px-4 py-2 text-sm"
          >
            Spróbuj ponownie
          </button>
          <a
            href="/"
            className="brut-border press bg-surface text-ink font-display px-4 py-2 text-sm"
          >
            Strona główna
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "KROKI — Krokomierz w przeglądarce" },
      { name: "description", content: "Bezpłatny krokomierz w przeglądarce. Licz kroki w czasie rzeczywistym bez aplikacji, bez konta, bez chmury. Dane zostają na Twoim urządzeniu." },
      { name: "theme-color", content: "#fffef8" },
      { name: "application-name", content: "KROKI" },
      { name: "apple-mobile-web-app-title", content: "KROKI" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "format-detection", content: "telephone=no" },
      { name: "robots", content: "index, follow" },
      { name: "author", content: "KROKI" },
      { name: "keywords", content: "krokomierz, pedometer, kroki, step counter, spacer, zdrowie, fitness, PWA, przeglądarka" },
      // Open Graph
      { property: "og:type", content: "website" },
      { property: "og:title", content: "KROKI — Krokomierz w przeglądarce" },
      { property: "og:description", content: "Licz kroki w czasie rzeczywistym. Bez aplikacji, bez konta, bez chmury." },
      { property: "og:image", content: "/og-image.svg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "KROKI — brutalistyczny krokomierz" },
      { property: "og:site_name", content: "KROKI" },
      { property: "og:locale", content: "pl_PL" },
      // Twitter Card
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "KROKI — Krokomierz w przeglądarce" },
      { name: "twitter:description", content: "Licz kroki w czasie rzeczywistym. Bez aplikacji, bez konta, bez chmury." },
      { name: "twitter:image", content: "/og-image.svg" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Archivo+Black&family=Space+Mono:wght@400;700&display=swap",
      },
      // PWA & Icons
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "apple-touch-icon", href: "/icon-192.svg" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <StepProvider>
        <Outlet />
        <BottomNav />
        <Toaster
          position="top-center"
          toastOptions={{
            unstyled: false,
            style: {
              background: "var(--surface)",
              color: "var(--ink)",
              border: "2.5px solid var(--ink)",
              borderRadius: "4px",
              boxShadow: "4px 4px 0 0 var(--ink)",
              fontFamily: "Space Mono, monospace",
            },
          }}
        />
      </StepProvider>
    </QueryClientProvider>
  );
}
