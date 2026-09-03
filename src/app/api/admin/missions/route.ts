import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseMissionBody } from "@/lib/missions/parse";
import { logDevApiError, devErrorDetail } from "@/lib/dev-api-error";

function requireAdmin(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }
  return null;
}

export async function GET() {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return denied;

  try {
    const rows = await prisma.mission.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: { _count: { select: { progress: true } } },
    });
    return NextResponse.json({
      items: rows.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        type: m.type,
        criterion: m.criterion,
        targetValue: Number(m.targetValue),
        rewardType: m.rewardType,
        rewardValue: Number(m.rewardValue),
        resets: m.resets,
        isActive: m.isActive,
        icon: m.icon,
        sortOrder: m.sortOrder,
        progressCount: m._count.progress,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    logDevApiError("admin/missions GET", e);
    return NextResponse.json(
      {
        error: "Erro ao listar missões. Confira se a migração foi aplicada.",
        ...(devErrorDetail(e) ? { detalhe: devErrorDetail(e) } : {}),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const parsed = parseMissionBody(body, false);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const d = parsed.data;
  try {
    const created = await prisma.mission.create({
      data: {
        title: d.title!,
        description: d.description ?? "",
        type: d.type!,
        criterion: d.criterion!,
        targetValue: d.targetValue!,
        rewardType: d.rewardType!,
        rewardValue: d.rewardValue!,
        resets: d.resets ?? d.type === "semanal",
        isActive: d.isActive ?? true,
        icon: d.icon ?? "target",
        sortOrder: d.sortOrder ?? 0,
        requiredLevel: d.requiredLevel ?? 1,
      },
    });
    return NextResponse.json({
      success: true,
      message: "Missão criada.",
      id: created.id,
    });
  } catch (e) {
    logDevApiError("admin/missions POST", e);
    return NextResponse.json(
      {
        error: "Erro ao criar missão.",
        ...(devErrorDetail(e) ? { detalhe: devErrorDetail(e) } : {}),
      },
      { status: 500 }
    );
  }
}
