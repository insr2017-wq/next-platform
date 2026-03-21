"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { buildInviteLink } from "@/lib/invite-link";

type InviteLinkCardProps = {
  referralCode: string;
};

export function InviteLinkCard({ referralCode }: InviteLinkCardProps) {
  const [copied, setCopied] = useState(false);
  const url = useMemo(() => {
    return buildInviteLink(referralCode);
  }, [referralCode]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // If clipboard isn't available, user can still select manually.
    }
  }

  return (
    <Card>
      <div style={{ padding: 14, display: "grid", gap: 10 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 10,
            alignItems: "center",
          }}
        >
          <input
            value={url}
            readOnly
            style={{
              width: "100%",
              padding: "12px 12px",
              borderRadius: 14,
              border: "1px solid var(--border)",
              background: "#f9fafb",
              fontSize: 12,
              color: "var(--brand)",
              fontWeight: 700,
            }}
            aria-label="Link de convite"
          />
          <Button type="button" onClick={copy} style={{ whiteSpace: "nowrap" }}>
            {copied ? "Copiado" : "Copiar link"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

