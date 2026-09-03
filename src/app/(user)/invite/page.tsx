import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTeamData } from "@/lib/team-data";
import { getPlatformSettings } from "@/lib/platform-settings";
import { InvitePageClient } from "@/components/invite/InvitePageClient";

export default async function InvitePage() {
  const session = await getSession();
  if (!session || session.role !== "user") {
    redirect("/login");
  }

  const [team, settings] = await Promise.all([
    getTeamData(prisma, session.userId),
    getPlatformSettings(),
  ]);

  return (
    <InvitePageClient
      team={team}
      commissionLevel1={Number(settings.commissionLevel1) || 10}
      commissionLevel2={Number(settings.commissionLevel2) || 5}
      commissionLevel3={Number(settings.commissionLevel3) || 2}
    />
  );
}
