import type { ReactNode } from "react";
import { BottomNav } from "@/components/nav/BottomNav";

/** Evita pré-render estático que acessa o banco durante `next build` / runtime edge. */
export const dynamic = "force-dynamic";
import { BannedUserGuard } from "./BannedUserGuard";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { applyPendingProductPayouts } from "@/lib/apply-product-payouts";
import {
  ensureUserBannedColumnSqlite,
  ensureUserPixColumnsSqlite,
  ensureUserCheckInColumnsSqlite,
  ensureUserSponsoredUserColumnSqlite,
} from "@/lib/user-schema-sqlite";
import { SessionGate } from "@/components/auth/SessionGate";

export default async function UserLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (session?.role === "user") {
    try {
      await ensureUserBannedColumnSqlite();
      await ensureUserPixColumnsSqlite();
      await ensureUserCheckInColumnsSqlite();
      await ensureUserSponsoredUserColumnSqlite();
      const u = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { banned: true },
      });
      if (u && !u.banned) {
        await applyPendingProductPayouts(session.userId);
      }
    } catch (e) {
      console.error("applyPendingProductPayouts:", e);
    }
  }

  return (
    <BannedUserGuard>
      <div style={{ paddingBottom: "var(--bottom-nav-height)" }}>
        <SessionGate />
        {children}
        <BottomNav
          items={[
            { href: "/home", label: "Início", icon: "home" },
            { href: "/invite", label: "Equipe", icon: "invite" },
            { href: "/profile", label: "Perfil", icon: "profile" },
          ]}
        />
      </div>
    </BannedUserGuard>
  );
}
