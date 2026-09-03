import * as React from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface Window {
    __pwaDeferredPrompt?: BeforeInstallPromptEvent | null;
  }
}

function readDeferredPrompt(): BeforeInstallPromptEvent | null {
  return typeof window !== "undefined" ? window.__pwaDeferredPrompt ?? null : null;
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = React.useState(false);
  const [isInstalled, setIsInstalled] = React.useState(false);

  React.useEffect(() => {
    const ua = window.navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && "ontouchend" in document));
    setIsInstalled(
      window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true,
    );
    setDeferredPrompt(readDeferredPrompt());

    const onPrompt = (e: Event) => {
      e.preventDefault();
      const ev = e as BeforeInstallPromptEvent;
      window.__pwaDeferredPrompt = ev;
      setDeferredPrompt(ev);
    };
    const onReady = () => setDeferredPrompt(readDeferredPrompt());
    const onInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      window.__pwaDeferredPrompt = null;
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("pwa-prompt-ready", onReady);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("pwa-prompt-ready", onReady);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = React.useCallback(async () => {
    const promptEvent = deferredPrompt ?? readDeferredPrompt();
    if (!promptEvent) return "unavailable" as const;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    setDeferredPrompt(null);
    window.__pwaDeferredPrompt = null;
    return outcome;
  }, [deferredPrompt]);

  return { canInstall: Boolean(deferredPrompt), isIOS, isInstalled, promptInstall };
}
