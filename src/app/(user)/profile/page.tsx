import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Gift, History, PiggyBank, Wallet } from "lucide-react";
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
  { label: "Solicitar saque", href: "/withdraw", icon: PiggyBank },
  { label: "Realizar recarga", href: "/deposit", icon: Wallet },
  { label: "Resgatar código bônus", href: "/bonus-code", icon: Gift },
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
            background: "linear-gradient(165deg, var(--brand) 0%, var(--brand-2) 100%)",
            borderRadius: 20,
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.18)",
            boxShadow: "0 14px 30px rgba(var(--brand-rgb), 0.3)",
            padding: 16,
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: 0.3, marginBottom: 6 }}>PERFIL</div>
          <div style={{ fontSize: 13, opacity: 0.86, fontWeight: 600 }}>
            Gerencie sua conta e acompanhe seus dados.
          </div>
        </div>

        <Card elevated>
          <div
            style={{
              padding: 16,
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: 12,
              alignItems: "center",
            }}
          >
            <div
              aria-hidden="true"
              style={{
                width: 60,
                height: 60,
                borderRadius: 999,
                background: "linear-gradient(160deg, rgba(var(--brand-rgb), 0.18) 0%, rgba(var(--brand-rgb), 0.08) 100%)",
                border: "1px solid rgba(var(--brand-rgb), 0.2)",
                display: "grid",
                placeItems: "center",
                fontWeight: 900,
                color: "var(--brand)",
                fontSize: 20,
              }}
            >
              {avatarDigit}
            </div>
            <div style={{ display: "grid", gap: 4 }}>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 900,
                  color: "rgba(17,24,39,0.95)",
                }}
              >
                ID:{" "}
                <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
                  {publicId}
                </span>
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "rgba(55,65,81,0.8)",
                  fontWeight: 700,
                }}
              >
                {maskedPhone}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div
            style={{
              padding: 16,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
            }}
          >
            <div style={{ display: "grid", gap: 4 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: "rgba(107,114,128,1)",
                }}
              >
                Saldo atual
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 900,
                  color: "rgba(17,24,39,0.95)",
                }}
              >
                R$ {balance.toFixed(2).replace(".", ",")}
              </div>
            </div>
            <div style={{ display: "grid", gap: 4 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: "rgba(107,114,128,1)",
                }}
              >
                Total recarregado
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 900,
                  color: "rgba(17,24,39,0.95)",
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
              padding: 6,
              display: "grid",
              gap: 4,
            }}
          >
            {ACTIONS.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 10px",
                    borderRadius: 12,
                    textDecoration: "none",
                    borderBottom:
                      index < ACTIONS.length - 1 ? "1px solid rgba(var(--brand-rgb), 0.08)" : "none",
                  }}
                >
                  <div
                    aria-hidden="true"
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: "rgba(var(--brand-rgb), 0.1)",
                      border: "1px solid rgba(var(--brand-rgb), 0.14)",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Icon size={18} color="var(--brand)" strokeWidth={2.1} />
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: "rgba(17,24,39,0.92)",
                    }}
                  >
                    {action.label}
                  </div>
                  <ArrowRight
                    size={16}
                    color="rgba(148,163,184,1)"
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
