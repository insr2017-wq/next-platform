import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { redeemMissionReward } from "@/lib/missions/redeem";
import { formatMissionReward } from "@/lib/missions/format";
import { prisma } from "@/lib/db";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "user") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Missão inválida." }, { status: 400 });
  }

  const result = await redeemMissionReward(session.userId, id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const mission = await prisma.mission.findUnique({
    where: { id },
    select: { rewardType: true, rewardValue: true, title: true },
  });

  return NextResponse.json({
    success: true,
    message: mission
      ? `Recompensa resgatada: ${formatMissionReward(mission.rewardType, Number(mission.rewardValue))}.`
      : "Recompensa resgatada.",
  });
}
