"use client";

import { useState } from "react";
import { Page } from "@/components/layout/Page";
import { Section } from "@/components/ui/Section";
import { InviteLinkCard } from "@/components/invite/InviteLinkCard";
import { Tabs } from "@/components/ui/Tabs";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { TeamData } from "@/lib/team-data";
import { formatDateBr } from "@/lib/datetime-br";

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  try {
    return formatDateBr(iso);
  } catch {
    return "—";
  }
}

type InvitePageClientProps = {
  team: TeamData;
  commissionLevel1: number;
  commissionLevel2: number;
  commissionLevel3: number;
};

export function InvitePageClient({
  team,
  commissionLevel1,
  commissionLevel2,
  commissionLevel3,
}: InvitePageClientProps) {
  const [level, setLevel] = useState("l1");

  const membersByLevel =
    level === "l1"
      ? team.members.filter((m) => m.level === 1)
      : level === "l2"
        ? team.members.filter((m) => m.level === 2)
        : team.members.filter((m) => m.level === 3);

  const tabs = [
    {
      id: "l1",
      label: "Nível 1",
      meta: `Ganho ${commissionLevel1}% (${team.level1Count})`,
    },
    {
      id: "l2",
      label: "Nível 2",
      meta: `Ganho ${commissionLevel2}% (${team.level2Count})`,
    },
    {
      id: "l3",
      label: "Nível 3",
      meta: `Ganho ${commissionLevel3}% (${team.level3Count})`,
    },
  ];

  return (
    <Page title="Equipe" backHref="/home" headerTone="brand">
      <div style={{ display: "grid", gap: 14 }}>
        <div
          style={{
            padding: "12px 4px 4px",
            display: "grid",
            gap: 6,
            fontSize: 13,
            color: "rgba(17,24,39,0.75)",
            lineHeight: 1.4,
          }}
        >
          <div style={{ fontWeight: 800, color: "rgba(17,24,39,0.92)" }}>
            Convide seus amigos e aumente seus ganhos
          </div>
          <div>
            Compartilhe seu link ou código de convite e acompanhe seus ganhos.
          </div>
        </div>
        <Card>
          <div
            style={{
              padding: 14,
              display: "grid",
              gridTemplateColumns: "64px 1fr",
              gap: 12,
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                border: "2px solid var(--brand)",
                background: "#fff",
                display: "grid",
                placeItems: "center",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              <img
                src="/logo-equipe.png"
                alt="BeMine"
                style={{
                  width: "100%",
                  height: "100%",
                  padding: 6,
                  objectFit: "contain",
                }}
              />
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontSize: 12, opacity: 0.65, fontWeight: 800 }}>
                Recarga da equipe
              </div>
              <div style={{ fontSize: 18, fontWeight: 900 }}>
                {formatBRL(team.teamRechargeTotal)}
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                <div style={{ fontSize: 12, opacity: 0.65, fontWeight: 800 }}>
                  Total de membros
                </div>
                <div style={{ fontSize: 16, fontWeight: 900 }}>
                  {team.totalMembers}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Section title="Link de convite">
          <InviteLinkCard referralCode={team.inviteCode} />
        </Section>

        <Section title="Níveis">
          <Tabs
            value={level}
            onChange={setLevel}
            tabs={tabs}
          />
        </Section>

        <Section title="Membros">
          <div style={{ display: "grid", gap: 12 }}>
            {membersByLevel.length === 0 ? (
              <div
                style={{
                  padding: 24,
                  textAlign: "center",
                  fontSize: 14,
                  color: "rgba(17,24,39,0.65)",
                  lineHeight: 1.5,
                  background: "rgba(243,244,246,0.8)",
                  borderRadius: 14,
                  border: "1px solid rgba(229,231,235,1)",
                }}
              >
                {team.totalMembers === 0
                  ? "Nenhum convidado registrado até o momento."
                  : `Nenhum membro no nível ${level === "l1" ? "1" : level === "l2" ? "2" : "3"}.`}
              </div>
            ) : (
              membersByLevel.map((m) => (
                <Card key={m.userId}>
                  <div
                    style={{
                      padding: 14,
                      display: "grid",
                      gridTemplateColumns: "44px 1fr auto",
                      gap: 10,
                      alignItems: "center",
                    }}
                  >
                    <div
                      aria-hidden="true"
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 999,
                        border: "1px solid var(--brand-border)",
                        background: "var(--brand-light)",
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 900,
                        color: "var(--brand)",
                        fontSize: 12,
                      }}
                    >
                      {m.phoneMasked.slice(0, 1) === "—"
                        ? "?"
                        : m.phoneMasked.replace(/\D/g, "").slice(0, 1) || "?"}
                    </div>
                    <div style={{ display: "grid", gap: 2 }}>
                      <div style={{ fontWeight: 900 }}>{m.phoneMasked}</div>
                      <div style={{ fontSize: 12, opacity: 0.7 }}>
                        Investido: {formatBRL(m.totalDeposited)}
                      </div>
                      <div style={{ fontSize: 12, opacity: 0.7 }}>
                        Entrou em: {formatDate(m.createdAt)}
                      </div>
                    </div>
                    <Badge
                      tone={
                        m.status === "Ativo"
                          ? "success"
                          : "warning"
                      }
                    >
                      {m.status}
                    </Badge>
                  </div>
                </Card>
              ))
            )}
          </div>
        </Section>
      </div>
    </Page>
  );
}
