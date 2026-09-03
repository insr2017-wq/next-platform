import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  ensureUserBannedColumnSqlite,
  ensureUserCheckInColumnsSqlite,
} from "@/lib/user-schema-sqlite";

export async function BannedUserGuard({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) {
    return <>{children}</>;
  }
  try {
    await ensureUserBannedColumnSqlite();
    await ensureUserCheckInColumnsSqlite();
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { banned: true },
    });
    if (user?.banned) {
      redirect("/api/auth/banned-kick");
    }
  } catch {
    // não bloquear render se DB falhar
  }
  return <>{children}</>;
}
