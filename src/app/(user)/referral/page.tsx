import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTeamData } from "@/lib/team-data";
import { EquipeClient } from "../invite/EquipeClient";
import { getPlatformSettings } from "@/lib/platform-settings";
import { getUserTotalInvested } from "@/lib/user-profit";
import { safeListUserMissions } from "@/lib/missions/list";

export default async function ReferralPage() {
  const session = await getSession();
  if (!session || session.role !== "user") redirect("/login");

  const [team, settings, totalInvested, missions] = await Promise.all([
    getTeamData(prisma, session.userId),
    getPlatformSettings(),
    getUserTotalInvested(session.userId),
    safeListUserMissions(session.userId),
  ]);

  const referralMissions = missions.items
    .filter((m) => m.type === "meta_indicacao")
    .map((m) => ({
      id: m.id,
      title: m.title,
      target: m.targetValue,
      current: m.currentProgress,
      rewardLabel: m.rewardLabel,
      completed: m.completed,
      canRedeem: m.canRedeem,
    }));

  return (
    <EquipeClient
      team={team}
      commissionLevel1={Number(settings.commissionLevel1) || 10}
      commissionLevel2={Number(settings.commissionLevel2) || 5}
      commissionLevel3={Number(settings.commissionLevel3) || 2}
      depositCommissionL1First={Number(settings.depositCommissionL1First) || 0}
      depositCommissionL1Next={Number(settings.depositCommissionL1Next) || 0}
      depositCommissionL2={Number(settings.depositCommissionL2) || 0}
      depositCommissionL3={Number(settings.depositCommissionL3) || 0}
      totalInvested={totalInvested}
      referralMissions={referralMissions}
    />
  );
}
