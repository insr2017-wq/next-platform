import { prisma } from "@/lib/db";
import { EmptyState } from "@/components/admin/EmptyState";
import {
  AdminTeamTable,
  type TeamRow,
} from "@/app/admin/referrals/admin-team-table";
import {
  aggregateDepositsByLevel,
  buildChildrenByInviter,
  teamLevelByUserId,
} from "@/lib/admin-referral-levels";

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
  id: string;
  fullName: string;
  phone: string;
  createdAt: Date;
  referredBy: string | null;
};

export default async function AdminReferralsPage() {
  let allUsers: UserListRow[] = [];
  let referredUsers: ReferredRow[] = [];
  let allReferrals: { inviterId: string; invitedUserId: string }[] = [];

  try {
    const [au, ru, ref] = await Promise.all([
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
          id: true,
          fullName: true,
          phone: true,
          createdAt: true,
          referredBy: true,
        },
      }),
      prisma.referral.findMany({
        select: { inviterId: true, invitedUserId: true },
      }),
    ]);
    allUsers = au;
    referredUsers = ru;
    allReferrals = ref;
  } catch {
    allUsers = [];
    referredUsers = [];
    allReferrals = [];
  }

  if (allUsers.length === 0) {
    return (
      <div style={{ marginTop: 8 }}>
        <EmptyState message="Nenhum usuário cadastrado. Cadastre usuários para ver códigos de convite e equipe." />
      </div>
    );
  }

  const childrenByInviter = buildChildrenByInviter(allReferrals);

  const inviteesByNormalizedCode = new Map<
    string,
    { id: string; fullName: string; phone: string; createdAt: string }[]
  >();
  for (const u of referredUsers) {
    const raw = u.referredBy?.trim();
    if (!raw) continue;
    const key = normalizeInviteCode(raw);
    if (!inviteesByNormalizedCode.has(key)) {
      inviteesByNormalizedCode.set(key, []);
    }
    inviteesByNormalizedCode.get(key)!.push({
      id: u.id,
      fullName: u.fullName ?? "—",
      phone: u.phone ?? "—",
      createdAt: u.createdAt.toISOString(),
    });
  }

  const depositUserIds = new Set<string>(referredUsers.map((u) => u.id));
  for (const r of allReferrals) {
    depositUserIds.add(r.invitedUserId);
  }

  const paidSumByUserId = new Map<string, number>();
  const hasPaidDepositByUserId = new Map<string, boolean>();

  if (depositUserIds.size > 0) {
    try {
      const paidDeposits = await prisma.deposit.findMany({
        where: { userId: { in: [...depositUserIds] }, status: "paid" },
        select: { userId: true, amount: true },
      });
      for (const d of paidDeposits) {
        hasPaidDepositByUserId.set(d.userId, true);
        const prev = paidSumByUserId.get(d.userId) ?? 0;
        paidSumByUserId.set(d.userId, prev + Number(d.amount));
      }
    } catch {
      /* mantém mapas vazios */
    }
  }

  const totalInvitees = referredUsers.filter((u) => u.referredBy?.trim()).length;
  const rows: TeamRow[] = allUsers.map((u) => {
    const codeKey = normalizeInviteCode(u.inviteCode ?? "");
    const invitees = inviteesByNormalizedCode.get(codeKey) ?? [];

    const levelByUserId = teamLevelByUserId(u.id, childrenByInviter);
    for (const inv of invitees) {
      if (!levelByUserId.has(inv.id)) {
        levelByUserId.set(inv.id, 1);
      }
    }

    const depositByLevel = aggregateDepositsByLevel(levelByUserId, paidSumByUserId);
    const teamDepositTotal = depositByLevel.reduce((s, x) => s + x.depositTotal, 0);

    let activeInviteCount = 0;
    for (const uid of levelByUserId.keys()) {
      if (hasPaidDepositByUserId.get(uid)) activeInviteCount += 1;
    }

    const inviteesWithLevel = invitees.map((inv) => ({
      ...inv,
      level: levelByUserId.get(inv.id) ?? 1,
    }));

    return {
      id: u.id,
      fullName: u.fullName ?? "—",
      phone: u.phone ?? "—",
      inviteCode: u.inviteCode ?? "—",
      createdAt: u.createdAt.toISOString(),
      inviteCount: invitees.length,
      activeInviteCount,
      teamDepositTotal,
      depositByLevel,
      invitees: inviteesWithLevel,
    };
  });

  return (
    <div style={{ marginTop: 8, display: "grid", gap: 18 }}>
      <div>
        <h2
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 900,
            color: "var(--text)",
            letterSpacing: -0.02,
          }}
        >
          Indicadores e convites
        </h2>
        <p style={{ margin: "8px 0 0", fontSize: 14, color: "rgba(12,12,12,0.58)", lineHeight: 1.45, maxWidth: 720 }}>
          Visão geral por usuário: convidados pelo código, rede em até <strong>3 níveis</strong> (tabela{" "}
          <code style={{ fontSize: 12 }}>Referral</code>, igual à equipe no app), depósitos pagos por nível e totais.
        </p>
      </div>

      {totalInvitees === 0 && (
        <div
          role="status"
          style={{
            borderRadius: 14,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            padding: "16px 18px",
            boxShadow: "0 4px 14px rgba(0,0,0,0.05)",
          }}
        >
          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "var(--text)" }}>
            Nenhum convite registrado ainda
          </p>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "rgba(12,12,12,0.58)", lineHeight: 1.5 }}>
            Quando alguém se cadastrar informando o código de convite de um usuário, a contagem e a lista de convidados
            aparecerão na tabela. Todos os usuários e seus códigos já estão listados.
          </p>
        </div>
      )}

      <AdminTeamTable rows={rows} />
    </div>
  );
}
