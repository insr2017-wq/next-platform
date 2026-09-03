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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return denied;

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  const existing = await prisma.mission.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Missão não encontrada." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const parsed = parseMissionBody(body, true);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    await prisma.mission.update({
      where: { id },
      data: parsed.data,
    });
  } catch (e) {
    logDevApiError("admin/missions PATCH", e);
    return NextResponse.json(
      {
        error: "Erro ao atualizar.",
        ...(devErrorDetail(e) ? { detalhe: devErrorDetail(e) } : {}),
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, message: "Missão atualizada." });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return denied;

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  const existing = await prisma.mission.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Missão não encontrada." }, { status: 404 });
  }

  try {
    await prisma.mission.delete({ where: { id } });
  } catch (e) {
    logDevApiError("admin/missions DELETE", e);
    return NextResponse.json({ error: "Erro ao excluir." }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Missão excluída." });
}
