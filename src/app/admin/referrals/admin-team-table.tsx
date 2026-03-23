"use client";

import { Fragment, useState } from "react";
import { formatDateTimeBr } from "@/lib/datetime-br";

export type TeamRow = {
  id: string;
  fullName: string;
  phone: string;
  inviteCode: string;
  createdAt: string;
  inviteCount: number;
  invitees: { fullName: string; phone: string; createdAt: string }[];
};

function formatDate(iso: string) {
  try {
    return formatDateTimeBr(iso);
  } catch {
    return iso;
  }
}

export function AdminTeamTable({ rows }: { rows: TeamRow[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-[var(--border)] bg-[var(--surface-muted)] text-xs uppercase tracking-wide text-[var(--muted)]">
          <tr>
            <th className="px-4 py-3">Nome</th>
            <th className="px-4 py-3">Telefone</th>
            <th className="px-4 py-3">Código de convite</th>
            <th className="px-4 py-3 text-center">Convidados</th>
            <th className="px-4 py-3">Cadastro</th>
            <th className="px-4 py-3 w-28" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const expanded = openId === r.id;
            return (
              <Fragment key={r.id}>
                <tr className="border-b border-[var(--border)] hover:bg-[var(--surface-muted)]/50">
                  <td className="px-4 py-3 font-medium text-[var(--foreground)]">
                    {r.fullName}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">{r.phone}</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.inviteCode}</td>
                  <td className="px-4 py-3 text-center font-semibold">
                    {r.inviteCount}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {formatDate(r.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    {r.inviteCount > 0 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setOpenId(expanded ? null : r.id)
                        }
                        className="text-xs font-medium text-[var(--accent)] hover:underline"
                      >
                        {expanded ? "Ocultar" : "Ver equipe"}
                      </button>
                    ) : (
                      <span className="text-xs text-[var(--muted)]">—</span>
                    )}
                  </td>
                </tr>
                {expanded && r.invitees.length > 0 && (
                  <tr className="bg-[var(--surface-muted)]/30">
                    <td colSpan={6} className="px-4 py-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                        Convidados por este código
                      </p>
                      <ul className="divide-y divide-[var(--border)] rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                        {r.invitees.map((inv, i) => (
                          <li
                            key={`${r.id}-${inv.phone}-${i}`}
                            className="flex flex-wrap items-center gap-4 px-4 py-2 text-sm"
                          >
                            <span className="font-medium">{inv.fullName}</span>
                            <span className="text-[var(--muted)]">{inv.phone}</span>
                            <span className="text-xs text-[var(--muted)]">
                              {formatDate(inv.createdAt)}
                            </span>
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
    </div>
  );
}
