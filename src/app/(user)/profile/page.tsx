import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarCheck, ChevronRight, History, Key, PiggyBank, Users, Wallet } from "lucide-react";
import { Page } from "@/components/layout/Page";
import { Card } from "@/components/ui/Card";
import { LogoutButton } from "@/components/profile/LogoutButton";
import { getSession } from "@/lib/auth";
import { maskPhone } from "@/lib/format";
import { prisma } from "@/lib/db";
import {
  ensureUserPublicIdColumnAndBackfill,
  ensureUserPixColumnsSqlite,
  ensureUserCheckInColumnsSqlite,
} from "@/lib/user-schema-sqlite";

type ActionItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
};

const ACTIONS: ActionItem[] = [
  { label: "Pagamento / Depósito", href: "/deposit", icon: Wallet },
  { label: "Retirada", href: "/withdraw", icon: PiggyBank },
  { label: "Check-in", href: "/check-in", icon: CalendarCheck },
  { label: "Para convidar amigos", href: "/invite", icon: Users },
  { label: "Sacar / Gestão PIX", href: "/withdraw", icon: Key },
  { label: "Histórico", href: "/history", icon: History },
];

export default async function ProfilePage() {
  let session = null;
  try {
    session = await getSession();
  } catch {
    redirect("/login");
  }
  if (!session) {
    redirect("/login");
  }

  let user:
    | {
        phone: string;
        balance: number;
        publicId: string | null;
        pixKeyType: string | null;
        pixKey: string | null;
      }
    | null = null;
  try {
    await ensureUserPublicIdColumnAndBackfill();
    await ensureUserPixColumnsSqlite();
    await ensureUserCheckInColumnsSqlite();
    user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { phone: true, balance: true, publicId: true, pixKeyType: true, pixKey: true },
    });
  } catch {
    redirect("/login");
  }
  if (!user) {
    redirect("/login");
  }

  let totalRecarregado = 0;
  try {
    const totalDepositsResult = await prisma.deposit.aggregate({
      where: { userId: session.userId, status: "paid" },
      _sum: { amount: true },
    });
    totalRecarregado = totalDepositsResult._sum.amount ?? 0;
  } catch {
    // use 0 if aggregate fails
  }

  const maskedPhone = maskPhone(user.phone ?? "");
  const balance = Number(user.balance ?? 0);
  const publicId = (user.publicId && String(user.publicId).trim()) || "—";
  const avatarDigit =
    (user.phone ?? "").replace(/\D/g, "").slice(-1) ||
    (publicId.startsWith("ID") ? publicId.slice(2, 3) : "") ||
    "·";

  return (
    <Page title="Perfil" hideHeader>
      <div style={{ display: "grid", gap: 14 }}>
        <div
          style={{
            borderRadius: 24,
            padding: "16px 14px 18px",
            background:
              "linear-gradient(180deg, rgba(18,72,162,0.58) 0%, rgba(16,55,126,0.48) 100%)",
            border: "1px solid rgba(197,222,255,0.34)",
            boxShadow: "0 16px 34px rgba(6,31,87,0.3)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "46px 1fr 46px",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Link
              href="/home"
              aria-label="Voltar"
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                border: "1px solid rgba(221,236,255,0.35)",
                background: "rgba(255,255,255,0.12)",
                color: "#f2f8ff",
                display: "grid",
                placeItems: "center",
                fontSize: 24,
                fontWeight: 900,
                lineHeight: 1,
              }}
            >
              ←
            </Link>
            <div style={{ textAlign: "center", fontSize: 22, fontWeight: 900, letterSpacing: 0.8, color: "#f2f8ff" }}>
              PERFIL
            </div>
            <div />
          </div>

          <div
            style={{
              padding: 14,
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: 12,
              alignItems: "center",
              borderRadius: 22,
              border: "1px solid rgba(206,226,255,0.42)",
              background: "linear-gradient(165deg, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0.12) 100%)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
            }}
          >
            <div
              aria-hidden="true"
              style={{
                width: 68,
                height: 68,
                borderRadius: 18,
                background: "rgba(255,255,255,0.16)",
                border: "1px solid rgba(233,244,255,0.45)",
                display: "grid",
                placeItems: "center",
                fontWeight: 900,
                color: "#f2f8ff",
                fontSize: 24,
              }}
            >
              {avatarDigit}
            </div>
            <div style={{ display: "grid", gap: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, color: "rgba(230,241,255,0.92)" }}>
                USUÁRIO
              </div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  color: "#f3f8ff",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                }}
              >
                {publicId}
              </div>
              <div style={{ fontSize: 14, color: "rgba(230,241,255,0.82)", fontWeight: 700 }}>
                Saldo: R$ {balance.toFixed(2).replace(".", ",")}
              </div>
              <div style={{ fontSize: 12, color: "rgba(220,234,255,0.78)", fontWeight: 600 }}>{maskedPhone}</div>
            </div>
          </div>
        </div>

        <Card>
          <div
            style={{
              padding: 14,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            <div style={{ display: "grid", gap: 4 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 900,
                  color: "var(--text-soft)",
                }}
              >
                Saldo atual
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 900,
                  color: "rgba(8,32,82,0.95)",
                }}
              >
                R$ {balance.toFixed(2).replace(".", ",")}
              </div>
            </div>
            <div style={{ display: "grid", gap: 4 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 900,
                  color: "var(--text-soft)",
                }}
              >
                Total recarregado
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 900,
                  color: "rgba(8,32,82,0.95)",
                }}
              >
                R$ {Number(totalRecarregado).toFixed(2).replace(".", ",")}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div
            style={{
              padding: 10,
              display: "grid",
              gap: 6,
            }}
          >
            {ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 10px",
                    borderRadius: 14,
                    textDecoration: "none",
                    border: "1px solid rgba(198,220,255,0.38)",
                    background: "linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(242,248,255,0.56) 100%)",
                  }}
                >
                  <div
                    aria-hidden="true"
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background: "rgba(15,76,179,0.11)",
                      border: "1px solid rgba(15,76,179,0.24)",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Icon size={20} color="var(--brand)" strokeWidth={2.2} />
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 900,
                      color: "rgba(12,30,70,0.94)",
                    }}
                  >
                    {action.label}
                  </div>
                  <ChevronRight
                    size={17}
                    color="rgba(132,153,187,0.95)"
                    strokeWidth={2.1}
                  />
                </Link>
              );
            })}
          </div>
        </Card>

        <Card>
          <div style={{ padding: 16 }}>
            <LogoutButton />
          </div>
        </Card>
      </div>
    </Page>
  );
}
