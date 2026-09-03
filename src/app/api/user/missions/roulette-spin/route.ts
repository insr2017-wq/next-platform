import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { spinDailyRoulette } from "@/lib/roulette";

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "user") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const result = await spinDailyRoulette(session.userId);
    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error,
          extraRemaining: "extraRemaining" in result ? result.extraRemaining : 0,
          alreadySpun: "alreadySpun" in result ? result.alreadySpun : false,
        },
        { status: result.status },
      );
    }
    return NextResponse.json({
      success: true,
      prize: result.prize,
      extraRemaining: result.extraRemaining,
      usedExtra: result.usedExtra,
      alreadySpun: result.alreadySpun,
    });
  } catch (e) {
    console.error("[roulette] spin", e);
    return NextResponse.json({ error: "Não foi possível girar a roleta agora." }, { status: 500 });
  }
}
