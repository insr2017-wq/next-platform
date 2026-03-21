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
    padding: "12px 14px",
    fontSize: 14,
    fontWeight: 900,
    boxShadow: "0 10px 20px var(--brand-shadow)",
  } as const;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(17,24,39,0.45)",
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
          background: "var(--surface)",
          border: "1px solid rgba(229,231,235,0.95)",
          borderRadius: 18,
          boxShadow: "0 22px 60px rgba(0,0,0,0.18)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: 14,
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 900, color: "rgba(17,24,39,0.92)", textAlign: "center" }}>
            {safeTitle}
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fechar"
            style={{
              position: "absolute",
              right: 10,
              top: 10,
              width: 28,
              height: 28,
              borderRadius: 999,
              border: "1px solid rgba(229,231,235,0.95)",
              background: "#fff",
              color: "rgba(17,24,39,0.72)",
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

        <div style={{ padding: 14 }}>
          <div
            style={{
              fontSize: 13,
              color: "rgba(17,24,39,0.78)",
              fontWeight: 800,
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
              textAlign: "center",
              maxWidth: 460,
              margin: "0 auto",
            }}
          >
            {text}
          </div>

          <div style={{ marginTop: 14, display: "flex", justifyContent: "center" }}>
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
                  border: "1px solid var(--brand)",
                  background: "var(--brand)",
                  color: "#fff",
                  width: "auto",
                  cursor: "pointer",
                }}
              >
                Entrar no grupo
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
                }}
              >
                Entrar no grupo
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

