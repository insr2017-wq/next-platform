"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

type Props = {
  enabled: boolean;
  title: string;
  text: string;
  link: string;
};

export function WelcomeModalClient({ enabled, title, text, link }: Props) {
  const [open, setOpen] = useState(false);

  const canShow = enabled && (text ?? "").trim().length > 0;

  useEffect(() => {
    setOpen(canShow);
  }, [canShow]);

  if (!open) return null;

  const safeTitle = (title ?? "").trim().length > 0 ? title.trim() : "Boas-vindas";
  const safeLink = (link ?? "").trim();
  const hasLink = safeLink.length > 0;

  const buttonStyle = {
    borderRadius: 999,
    padding: "13px 16px",
    fontSize: 14,
    fontWeight: 900,
    boxShadow: "0 12px 26px rgba(8,58,141,0.3)",
  } as const;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "linear-gradient(180deg, rgba(6,26,67,0.72) 0%, rgba(6,26,67,0.54) 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 12,
        zIndex: 60,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background:
            "linear-gradient(180deg, rgba(8,52,130,0.97) 0%, rgba(6,34,88,0.98) 55%, rgba(7,27,72,0.99) 100%)",
          border: "1px solid rgba(182,213,255,0.24)",
          borderRadius: 24,
          boxShadow: "0 30px 70px rgba(0,0,0,0.35)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            minHeight: 120,
            padding: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            background:
              "linear-gradient(180deg, rgba(19,116,212,0.28) 0%, rgba(19,116,212,0.08) 70%, transparent 100%)",
          }}
        >
          <div
            style={{
              fontSize: 34,
              lineHeight: 1.03,
              fontWeight: 900,
              color: "#f2f8ff",
              textAlign: "center",
              textTransform: "uppercase",
              letterSpacing: 1.1,
            }}
          >
            Notificacao
            <div style={{ fontSize: 20, letterSpacing: 2.4, opacity: 0.9 }}>Importante</div>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fechar"
            style={{
              position: "absolute",
              right: 10,
              top: 10,
              width: 30,
              height: 30,
              borderRadius: 999,
              border: "1px solid rgba(182,213,255,0.4)",
              background: "rgba(255,255,255,0.12)",
              color: "rgba(241,248,255,0.9)",
              fontWeight: 900,
              cursor: "pointer",
              boxShadow: "none",
              lineHeight: 1,
              padding: 0,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: "4px 18px 18px" }}>
          <div style={{ fontSize: 38, fontWeight: 900, color: "#f5f9ff", lineHeight: 1, marginBottom: 8 }}>
            Bem-vindo
          </div>
          <div
            style={{
              fontSize: 22,
              color: "#f2f8ff",
              fontWeight: 900,
              lineHeight: 1.2,
              whiteSpace: "pre-wrap",
              maxWidth: 470,
            }}
          >
            {safeTitle}
          </div>
          <div
            style={{
              marginTop: 10,
              fontSize: 20,
              color: "rgba(228,240,255,0.94)",
              fontWeight: 500,
              lineHeight: 1.35,
              whiteSpace: "pre-wrap",
            }}
          >
            {text}
          </div>

          <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
            {hasLink ? (
              <a
                href={safeLink}
                target="_blank"
                rel="noreferrer"
                onClick={() => setOpen(false)}
                style={{
                  ...buttonStyle,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textDecoration: "none",
                  border: "1px solid rgba(57,196,255,0.68)",
                  background: "linear-gradient(180deg, #18b8f7 0%, #1296dc 100%)",
                  color: "#fff",
                  width: "100%",
                  cursor: "pointer",
                  textTransform: "uppercase",
                  letterSpacing: 1.1,
                }}
              >
                Acessar grupo oficial
              </a>
            ) : (
              <Button
                type="button"
                disabled
                style={{
                  ...buttonStyle,
                  opacity: 0.65,
                  cursor: "not-allowed",
                  boxShadow: "none",
                  width: "100%",
                  textTransform: "uppercase",
                  letterSpacing: 1.1,
                }}
              >
                Acessar grupo oficial
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              style={{
                ...buttonStyle,
                width: "100%",
                background: "rgba(255,255,255,0.94)",
                border: "1px solid rgba(255,255,255,0.95)",
                color: "#0d306f",
                textTransform: "uppercase",
                letterSpacing: 0.8,
                boxShadow: "none",
              }}
            >
              OK
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

