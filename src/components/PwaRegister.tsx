"use client";

import { useEffect } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface Window {
    __pwaDeferredPrompt?: BeforeInstallPromptEvent | null;
  }
}

/**
 * Captura o evento nativo o mais cedo possível (antes da tela Início montar)
 * e registra o service worker exigido pelo Chrome no Android.
 */
export function PwaRegister() {
  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      window.__pwaDeferredPrompt = event as BeforeInstallPromptEvent;
      window.dispatchEvent(new Event("pwa-prompt-ready"));
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  return null;
}
