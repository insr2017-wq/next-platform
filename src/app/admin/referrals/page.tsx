import { prisma } from "@/lib/db";
import { EmptyState } from "@/components/admin/EmptyState";
import {
  AdminTeamTable,
  type TeamRow,
} from "@/app/admin/referrals/admin-team-table";

function normalizeInviteCode(code: string) {
  return code.trim().toUpperCase();
}

type UserListRow = {
  id: string;
  fullName: string;
  phone: string;
  inviteCode: string;
  createdAt: Date;
};
type ReferredRow = {
  fullName: string;
  phone: string;
  createdAt: Date;
  referredBy: string | null;
};

export default async function AdminReferralsPage() {
  let allUsers: UserListRow[] = [];
  let referredUsers: ReferredRow[] = [];
  try {
    const [au, ru] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          fullName: true,
          phone: true,
          inviteCode: true,
          createdAt: true,
        },
      }),
      prisma.user.findMany({
        where: {
          referredBy: { not: null },
        },
        select: {
          fullName: true,
          phone: true,
          createdAt: true,
          referredBy: true,
        },
      }),
    ]);
    allUsers = au;
    referredUsers = ru;
  } catch {
    allUsers = [];
    referredUsers = [];
  }

  if (allUsers.length === 0) {
    return (
      <div style={{ marginTop: 8 }}>
        <EmptyState message="Nenhum usuário cadastrado. Cadastre usuários para ver códigos de convite e equipe." />
      </div>
    );
  }

  const inviteesByNormalizedCode = new Map<
    string,
    { fullName: string; phone: string; createdAt: string }[]
  >();
  for (const u of referredUsers) {
    const raw = u.referredBy?.trim();
    if (!raw) continue;
    const key = normalizeInviteCode(raw);
    if (!inviteesByNormalizedCode.has(key)) {
      inviteesByNormalizedCode.set(key, []);
    }
    inviteesByNormalizedCode.get(key)!.push({
      fullName: u.fullName ?? "—",
      phone: u.phone ?? "—",
      createdAt: u.createdAt.toISOString(),
    });
  }

  const totalInvitees = referredUsers.filter((u) => u.referredBy?.trim()).length;
  const rows: TeamRow[] = allUsers.map((u) => {
    const codeKey = normalizeInviteCode(u.inviteCode ?? "");
    const invitees = inviteesByNormalizedCode.get(codeKey) ?? [];
    return {
      id: u.id,
      fullName: u.fullName ?? "—",
      phone: u.phone ?? "—",
      inviteCode: u.inviteCode ?? "—",
      createdAt: u.createdAt.toISOString(),
      inviteCount: invitees.length,
      invitees,
    };
  });

  return (
    <div className="mt-3 space-y-4">
      {totalInvitees === 0 && (
        <div
          className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/40 px-4 py-3 text-sm text-[var(--muted)]"
          role="status"
        >
          <p className="font-medium text-[var(--foreground)]">
            Nenhum convite registrado ainda
          </p>
          <p className="mt-1">
            Quando alguém se cadastrar informando o código de convite de um
            usuário, a contagem e a lista de convidados aparecerão abaixo. Todos
            os usuários e seus códigos já estão listados.
          </p>
        </div>
      )}
      <AdminTeamTable rows={rows} />
    </div>
  );
}
