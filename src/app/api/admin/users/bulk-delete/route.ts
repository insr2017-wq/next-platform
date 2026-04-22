import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

type BulkDeleteBody = {
  ids?: unknown;
};

function requireAdmin(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }
  return null;
}

export async function DELETE(request: Request) {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return denied;

  let body: BulkDeleteBody;
  try {
    body = (await request.json()) as BulkDeleteBody;
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const rawIds = Array.isArray(body.ids) ? body.ids : [];
  const ids = Array.from(
    new Set(
      rawIds
        .filter((v): v is string => typeof v === "string")
        .map((v) => v.trim())
        .filter((v) => v.length > 0),
    ),
  );

  if (ids.length === 0) {
    return NextResponse.json({ error: "Nenhum usuário selecionado." }, { status: 400 });
  }

  if (ids.length > 300) {
    return NextResponse.json({ error: "Selecione no máximo 300 usuários por vez." }, { status: 400 });
  }

  try {
    const foundUsers = await prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, role: true },
    });
    const foundMap = new Map(foundUsers.map((u) => [u.id, u]));

    let skippedAdmins = 0;
    let skippedSelf = 0;
    let skippedNotFound = 0;
    const deletableIds: string[] = [];

    for (const id of ids) {
      const target = foundMap.get(id);
      if (!target) {
        skippedNotFound += 1;
        continue;
      }
      if (session!.userId === id) {
        skippedSelf += 1;
        continue;
      }
      if (target.role === "admin") {
        skippedAdmins += 1;
        continue;
      }
      deletableIds.push(id);
    }

    let deletedCount = 0;
    if (deletableIds.length > 0) {
      const result = await prisma.user.deleteMany({
        where: { id: { in: deletableIds } },
      });
      deletedCount = result.count;
    }

    return NextResponse.json({
      success: true,
      deletedCount,
      skippedAdmins,
      skippedSelf,
      skippedNotFound,
    });
  } catch (e) {
    console.error("[api/admin/users/bulk-delete] Falha ao excluir em lote:", e);
    return NextResponse.json({ error: "Erro ao excluir usuários em lote." }, { status: 500 });
  }
}
