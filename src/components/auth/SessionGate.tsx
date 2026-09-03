"use client";

import { useEffect } from "react";

const MARKER_KEY = "session_marker_v1";

/**
 * Garante sessão NÃO persistente entre reinícios do navegador:
 * - Cookie httpOnly pode ser restaurado por alguns navegadores.
 * - Este gate exige um marcador em sessionStorage (limpo ao fechar o navegador).
 * Se existir sessão no servidor, mas não existir marcador, faz logout e redireciona para /login.
 */
export function SessionGate() {
  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        if (sessionStorage.getItem(MARKER_KEY) === "1") return;
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        const data = (await res.json().catch(() => ({}))) as {
          session?: { userId: string; role: "user" | "admin"; phone: string } | null;
        };
        if (cancelled) return;
        if (data?.session) {
          await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
          if (cancelled) return;
          window.location.href = "/login";
          return;
        }
      } catch {
        // Não bloquear a UI se falhar.
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

export function markSessionActive() {
  try {
    sessionStorage.setItem(MARKER_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function clearSessionMarker() {
  try {
    sessionStorage.removeItem(MARKER_KEY);
  } catch {
    /* ignore */
  }
}

