import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { safeListUserMissions } from "@/lib/missions/list";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "user") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const data = await safeListUserMissions(session.userId);
  return NextResponse.json(data);
}
