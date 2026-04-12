"use client";

import type { CSSProperties } from "react";
import { Fragment, useMemo, useState } from "react";
import { formatDateTimeBr } from "@/lib/datetime-br";

export type TeamInvitee = {
  id: string;
  fullName: string;
  phone: string;
  createdAt: string;
  /** Nível na rede do indicador (1–3), alinhado à tabela Referral */
  level: 1 | 2 | 3;
};

export type TeamDepositLevel = {
  level: 1 | 2 | 3;
  memberCount: number;
  depositTotal: number;
};

export type TeamRow = {
  id: string;
  fullName: string;
  phone: string;
  inviteCode: string;
  createdAt: string;
  inviteCount: number;
  activeInviteCount: number;
  teamDepositTotal: number;
  depositByLevel: TeamDepositLevel[];
  invitees: TeamInvitee[];
};

function formatDate(iso: string) {
  try {
    return formatDateTimeBr(iso);
  } catch {
    return iso;
  }
}

function formatBRL(n: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
}

function digitsOnly(s: string) {
  return s.replace(/\D/g, "");
}

const muted = "rgba(12,12,12,0.55)";
const thStyle: CSSProperties = {
  padding: "12px 14px",
  textAlign: "left",
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: muted,
  borderBottom: "1px solid var(--border)",
  background: "var(--surface-soft)",
  whiteSpace: "nowrap",
};

export function AdminTeamTable({ rows }: { rows: TeamRow[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return rows;
    const qd = digitsOnly(q);
    if (!qd) {
      const lower = q.toLowerCase();
      return rows.filter((r) => r.phone.toLowerCase().includes(lower));
    }
    return rows.filter((r) => digitsOnly(r.phone).includes(qd));
  }, [rows, query]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ flex: "1 1 220px", minWidth: 0 }}>
          <label
            htmlFor="admin-team-phone-search"
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 800,
              color: "var(--text)",
              marginBottom: 6,
            }}
          >
            Buscar por telefone
          </label>
          <input
            id="admin-team-phone-search"
            type="search"
            placeholder="Ex.: 11999998888 ou parte do número"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            style={{
              width: "100%",
              maxWidth: 360,
              padding: "11px 14px",
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
              outline: "none",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          />
        </div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: muted,
            padding: "8px 0",
          }}
        >
          {filtered.length} de {rows.length} usuário{rows.length === 1 ? "" : "s"}
        </div>
      </div>

      <div
        style={{
          overflowX: "auto",
          borderRadius: 14,
          border: "1px solid var(--border)",
          background: "var(--surface)",
          boxShadow: "0 8px 28px rgba(0,0,0,0.06)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 880 }}>
          <thead>
            <tr>
              <th style={{ ...thStyle }}>Nome</th>
              <th style={{ ...thStyle }}>Telefone</th>
              <th style={{ ...thStyle }}>Código</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Convidados*</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Ativos**</th>
              <th style={{ ...thStyle, minWidth: 200 }}>Depósitos por nível</th>
              <th style={{ ...thStyle, textAlign: "right", whiteSpace: "nowrap" }}>Total dep.</th>
              <th style={{ ...thStyle }}>Cadastro</th>
              <th style={{ ...thStyle, width: 108 }} />
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, idx) => {
              const expanded = openId === r.id;
              return (
                <Fragment key={r.id}>
                  <tr
                    style={{
                      borderBottom: "1px solid var(--border)",
                      background: idx % 2 === 1 ? "rgba(var(--brand-rgb), 0.03)" : "transparent",
                    }}
                  >
                    <td
                      style={{
                        padding: "14px 14px",
                        fontSize: 14,
                        fontWeight: 800,
                        color: "var(--text)",
                      }}
                    >
                      {r.fullName || "—"}
                    </td>
                    <td style={{ padding: "14px 14px", fontSize: 14, fontWeight: 600, color: muted }}>
                      {r.phone}
                    </td>
                    <td
                      style={{
                        padding: "14px 14px",
                        fontFamily: "ui-monospace, monospace",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--text)",
                      }}
                    >
                      {r.inviteCode}
                    </td>
                    <td style={{ padding: "14px 14px", textAlign: "center", fontWeight: 900, fontSize: 14 }}>
                      {r.inviteCount}
                    </td>
                    <td style={{ padding: "14px 14px", textAlign: "center", fontWeight: 900, fontSize: 14 }}>
                      <span
                        style={{
                          display: "inline-block",
                          minWidth: 28,
                          padding: "2px 8px",
                          borderRadius: 999,
                          background:
                            r.activeInviteCount > 0
                              ? "rgba(var(--brand-rgb), 0.12)"
                              : "var(--surface-soft)",
                          color: r.activeInviteCount > 0 ? "var(--brand)" : muted,
                        }}
                      >
                        {r.activeInviteCount}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", verticalAlign: "top" }}>
                      <div style={{ display: "grid", gap: 4, fontSize: 11, fontWeight: 700, color: muted, lineHeight: 1.35 }}>
                        {r.depositByLevel.map((d) => (
                          <div key={d.level} style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "baseline" }}>
                            <span style={{ color: "var(--text)", minWidth: 22 }}>N{d.level}</span>
                            <span>
                              {d.memberCount} membro{d.memberCount === 1 ? "" : "s"}
                            </span>
                            <span style={{ color: "var(--text)", fontWeight: 800 }}>{formatBRL(d.depositTotal)}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "14px 14px",
                        textAlign: "right",
                        fontWeight: 900,
                        fontSize: 14,
                        color: "var(--text)",
                        whiteSpace: "nowrap",
                        verticalAlign: "middle",
                      }}
                    >
                      {formatBRL(r.teamDepositTotal)}
                    </td>
                    <td style={{ padding: "14px 14px", fontSize: 13, color: muted }}>
                      {formatDate(r.createdAt)}
                    </td>
                    <td style={{ padding: "14px 14px" }}>
                      {r.inviteCount > 0 ? (
                        <button
                          type="button"
                          onClick={() => setOpenId(expanded ? null : r.id)}
                          style={{
                            border: "1px solid var(--brand-border)",
                            background: expanded ? "var(--brand)" : "var(--surface)",
                            color: expanded ? "#fff" : "var(--brand)",
                            fontSize: 12,
                            fontWeight: 800,
                            padding: "8px 12px",
                            borderRadius: 999,
                            cursor: "pointer",
                          }}
                        >
                          {expanded ? "Ocultar" : "Ver equipe"}
                        </button>
                      ) : (
                        <span style={{ fontSize: 12, color: muted }}>—</span>
                      )}
                    </td>
                  </tr>
                  {expanded && r.invitees.length > 0 && (
                    <tr style={{ background: "var(--surface-soft)" }}>
                      <td colSpan={9} style={{ padding: "16px 18px 18px" }}>
                        <p
                          style={{
                            margin: "0 0 10px",
                            fontSize: 11,
                            fontWeight: 800,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            color: muted,
                          }}
                        >
                          Convidados com este código
                        </p>
                        <ul
                          style={{
                            margin: 0,
                            padding: 0,
                            listStyle: "none",
                            borderRadius: 12,
                            border: "1px solid var(--border)",
                            overflow: "hidden",
                            background: "var(--surface)",
                          }}
                        >
                          {r.invitees.map((inv, i) => (
                            <li
                              key={`${r.id}-${inv.id}-${i}`}
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                alignItems: "center",
                                gap: 12,
                                padding: "12px 14px",
                                borderBottom:
                                  i < r.invitees.length - 1 ? "1px solid var(--border)" : undefined,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 900,
                                  letterSpacing: "0.04em",
                                  padding: "3px 8px",
                                  borderRadius: 6,
                                  background: "rgba(var(--brand-rgb), 0.12)",
                                  color: "var(--brand)",
                                }}
                              >
                                N{inv.level}
                              </span>
                              <span style={{ fontWeight: 800, fontSize: 14 }}>{inv.fullName}</span>
                              <span style={{ fontSize: 14, fontWeight: 600, color: muted }}>{inv.phone}</span>
                              <span style={{ fontSize: 12, color: muted }}>{formatDate(inv.createdAt)}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: 28, textAlign: "center", fontSize: 14, fontWeight: 600, color: muted }}>
            Nenhum usuário encontrado para esta busca.
          </div>
        )}
      </div>
      <p style={{ margin: 0, fontSize: 12, color: muted, lineHeight: 1.55 }}>
        * <strong>Convidados</strong>: cadastros com o código deste indicador (campo{" "}
        <code style={{ fontSize: 11 }}>referredBy</code>). Pode diferir do total de pessoas na rede N1–N3 quando há
        apenas vínculo em <code style={{ fontSize: 11 }}>Referral</code>.
        <br />
        ** <strong>Ativos</strong>: na rede de até 3 níveis (N1–N3), quantos têm pelo menos um depósito{" "}
        <strong>pago</strong>.
        <br />
        <strong>Depósitos por nível</strong>: soma de depósitos <strong>pagos</strong> dos membros daquele nível na
        árvore de indicação (tabela <code style={{ fontSize: 11 }}>Referral</code>).
      </p>
    </div>
  );
}
