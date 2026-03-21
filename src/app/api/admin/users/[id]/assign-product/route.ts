import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  ensureUserBannedColumnSqlite,
  ensureUserPublicIdColumnAndBackfill,
} from "@/lib/user-schema-sqlite";
import { devErrorDetail, logDevApiError } from "@/lib/dev-api-error";

function requireAdmin(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }
  return null;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return denied;

  const { id: userId } = await context.params;
  if (!userId) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  try {
    await ensureUserBannedColumnSqlite();
    await ensureUserPublicIdColumnAndBackfill();
  } catch (e) {
    logDevApiError("admin/users assign-product POST", e);
    return NextResponse.json(
      {
        error: "Erro ao preparar o banco.",
        ...(devErrorDetail(e) ? { detalhe: devErrorDetail(e) } : {}),
      },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const productId =
    typeof (body as { productId?: string })?.productId === "string"
      ? (body as { productId: string }).productId.trim()
      : "";
  if (!productId) {
    return NextResponse.json({ error: "Selecione um produto." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  }

  try {
    await prisma.userProduct.create({
      data: {
        userId,
        productId: product.id,
        dailyYieldSnapshot: Number(product.dailyYield),
        cycleDaysSnapshot: Math.max(1, product.cycleDays),
        daysPaid: 0,
        lastPayoutAt: null,
        earningStatus: "active",
      },
    });
    return NextResponse.json({
      success: true,
      message: `Produto "${product.name}" atribuído ao usuário.`,
    });
  } catch (e) {
    logDevApiError("admin/users assign-product create", e);
    return NextResponse.json(
      {
        error: "Erro ao atribuir produto.",
        ...(devErrorDetail(e) ? { detalhe: devErrorDetail(e) } : {}),
      },
      { status: 500 }
    );
  }
}
