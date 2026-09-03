import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { devErrorDetail, logDevApiError } from "@/lib/dev-api-error";

function requireAdmin(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }
  return null;
}

/**
 * Remove atribuição de produto do usuário (apaga o registro em UserProduct).
 * Só remove se o userProduct pertencer ao usuário da URL.
 */
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; userProductId: string }> }
) {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return denied;

  const { id: userId, userProductId } = await context.params;
  if (!userId || !userProductId) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  const up = await prisma.userProduct.findFirst({
    where: { id: userProductId, userId },
    select: { id: true, product: { select: { name: true } } },
  });
  if (!up) {
    return NextResponse.json(
      { error: "Vínculo de produto não encontrado ou não pertence a este usuário." },
      { status: 404 }
    );
  }

  try {
    await prisma.userProduct.delete({ where: { id: userProductId } });
    return NextResponse.json({
      success: true,
      message: `Produto "${up.product.name}" removido do usuário.`,
    });
  } catch (e) {
    logDevApiError("admin/users products DELETE", e);
    return NextResponse.json(
      {
        error: "Erro ao remover produto.",
        ...(devErrorDetail(e) ? { detalhe: devErrorDetail(e) } : {}),
      },
      { status: 500 }
    );
  }
}
