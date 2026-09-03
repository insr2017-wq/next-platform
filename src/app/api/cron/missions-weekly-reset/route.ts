import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { openCurrentWeeklyPeriod } from "@/lib/missions/weekly-reset";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization") ?? "";
  const cronOk = Boolean(secret) && auth === `Bearer ${secret}`;

  if (!cronOk) {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
    }
  }

  const result = await openCurrentWeeklyPeriod();
  return NextResponse.json({
    success: true,
    message: "Período semanal das missões aberto.",
    opened: result.opened,
  });
}
