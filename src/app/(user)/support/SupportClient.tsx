"use client";

import { MessageSquare, Mail, Phone } from "lucide-react";
import { useState } from "react";
import { Page } from "@/components/layout/Page";
import { Card } from "@/components/ui/Card";
import { openExternalLink } from "@/lib/open-external-link";

const FAQ = [
  {
    q: "Como funciona o saque?",
    a: "O saque é processado em até 24h via Pix após aprovação.",
  },
  {
    q: "Como recarregar?",
    a: "Use Recarga, informe o valor e pague o Pix gerado. O saldo entra após a confirmação do pagamento.",
  },
];

export function SupportClient({ supportLink }: { supportLink: string }) {
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState<number | null>(0);

  function handleContact() {
    const ok = openExternalLink(supportLink);
    setError(ok ? "" : "Link de atendimento ainda não configurado.");
  }

  return (
    <Page title="Suporte" backHref="/profile" headerTone="brand">
      <div style={{ display: "grid", gap: 14 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10,
          }}
        >
          {[
            { icon: MessageSquare, label: "Chat" },
            { icon: Phone, label: "WhatsApp" },
            { icon: Mail, label: "E-mail" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={handleContact}
                style={{
                  appearance: "none",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  padding: 16,
                  borderRadius: 14,
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--text)",
                  cursor: "pointer",
                }}
              >
                <Icon size={22} color="var(--brand)" />
                <span style={{ fontSize: 11, fontWeight: 800 }}>{item.label}</span>
              </button>
            );
          })}
        </div>

        {error ? (
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--danger)" }}>{error}</div>
        ) : null}

        <Card>
          <div style={{ padding: 4 }}>
            {FAQ.map((item, index) => {
              const open = openId === index;
              return (
                <div
                  key={item.q}
                  style={{
                    borderBottom: index < FAQ.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : index)}
                    style={{
                      appearance: "none",
                      width: "100%",
                      textAlign: "left",
                      background: "transparent",
                      border: 0,
                      padding: "14px 16px",
                      cursor: "pointer",
                      color: "var(--text)",
                      fontSize: 13,
                      fontWeight: 800,
                    }}
                  >
                    {item.q}
                  </button>
                  {open ? (
                    <div
                      style={{
                        padding: "0 16px 14px",
                        fontSize: 12,
                        color: "var(--text-muted)",
                        lineHeight: 1.45,
                        fontWeight: 600,
                      }}
                    >
                      {item.a}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </Page>
  );
}
