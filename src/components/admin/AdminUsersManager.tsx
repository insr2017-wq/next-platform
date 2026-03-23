"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { formatDateBr } from "@/lib/datetime-br";

export type AdminUserRow = {
  id: string;
  publicId: string;
  phone: string;
  role: string;
  balance: number;
  banned: boolean;
  createdAt: string;
};

type AdminUsersManagerProps = {
  users: AdminUserRow[];
};

function formatBRL(n: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(n);
}

export function AdminUsersManager({ users }: AdminUsersManagerProps) {
  return (
    <div style={{ marginTop: 12, overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "var(--surface)",
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid var(--border)",
          boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
        }}
      >
        <thead>
          <tr style={{ background: "var(--app-bg)", borderBottom: "1px solid var(--border)" }}>
            <th style={{ padding: "10px 8px", textAlign: "left", fontSize: 11, fontWeight: 600 }}>
              ID
            </th>
            <th style={{ padding: "10px 8px", textAlign: "left", fontSize: 11, fontWeight: 600 }}>
              Telefone
            </th>
            <th style={{ padding: "10px 8px", textAlign: "right", fontSize: 11, fontWeight: 600 }}>
              Saldo
            </th>
            <th style={{ padding: "10px 8px", textAlign: "left", fontSize: 11, fontWeight: 600 }}>
              Função
            </th>
            <th style={{ padding: "10px 8px", textAlign: "left", fontSize: 11, fontWeight: 600 }}>
              Status
            </th>
            <th style={{ padding: "10px 8px", textAlign: "left", fontSize: 11, fontWeight: 600 }}>
              Cadastro
            </th>
            <th style={{ padding: "10px 8px", width: 48 }} aria-label="Ações" />
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} style={{ borderBottom: "1px solid var(--border)" }}>
              <td
                style={{
                  padding: "10px 8px",
                  fontSize: 13,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                }}
              >
                {u.publicId || "—"}
              </td>
              <td style={{ padding: "10px 8px", fontSize: 13 }}>{u.phone}</td>
              <td style={{ padding: "10px 8px", fontSize: 13, textAlign: "right" }}>
                {formatBRL(Number(u.balance ?? 0))}
              </td>
              <td style={{ padding: "10px 8px", fontSize: 13 }}>{u.role}</td>
              <td style={{ padding: "10px 8px", fontSize: 13 }}>
                <span
                  style={{
                    fontWeight: 700,
                    color: u.banned ? "#b91c1c" : "#166534",
                  }}
                >
                  {u.banned ? "Banido" : "Ativo"}
                </span>
              </td>
              <td style={{ padding: "10px 8px", fontSize: 12, color: "#6b7280" }}>
                {formatDateBr(u.createdAt)}
              </td>
              <td style={{ padding: "10px 8px" }}>
                <Link
                  href={`/admin/users/${u.id}`}
                  aria-label="Gerenciar usuário"
                  style={{
                    display: "inline-grid",
                    placeItems: "center",
                    padding: 8,
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                    color: "var(--brand)",
                    textDecoration: "none",
                  }}
                >
                  <Pencil size={16} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
