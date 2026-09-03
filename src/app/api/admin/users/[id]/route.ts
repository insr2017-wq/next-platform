import { NextResponse } from "next/server";
import { getSession, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  ensureUserBannedColumnSqlite,
  ensureUserPublicIdColumnAndBackfill,
  ensureUserPixColumnsSqlite,
  ensureUserCheckInColumnsSqlite,
  ensureUserSponsoredUserColumnSqlite,
} from "@/lib/user-schema-sqlite";
import { devErrorDetail, logDevApiError } from "@/lib/dev-api-error";

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").trim();
}

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

  try {
    await ensureUserBannedColumnSqlite();
    await ensureUserPublicIdColumnAndBackfill();
    await ensureUserPixColumnsSqlite();
    await ensureUserCheckInColumnsSqlite();
    await ensureUserSponsoredUserColumnSqlite();
  } catch (e) {
    logDevApiError("admin/users PATCH ensure schema", e);
    return NextResponse.json(
      {
        error: "Não foi possível preparar o banco de dados.",
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

  const b = (body ?? {}) as {
    phone?: string;
    password?: string;
    banned?: boolean;
    sponsoredUser?: boolean;
    pixKeyType?: string;
    pixKey?: string;
  };

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  const data: {
    phone?: string;
    passwordHash?: string;
    banned?: boolean;
    sponsoredUser?: boolean;
    pixKeyType?: string | null;
    pixKey?: string | null;
  } = {};

  if (typeof b.phone === "string") {
    const normalizedPhone = normalizePhone(b.phone);
    const normalizedTargetPhone = normalizePhone(target.phone ?? "");

    if (normalizedPhone.length < 10) {
      return NextResponse.json(
        { error: "Telefone deve ter pelo menos 10 dígitos." },
        { status: 400 }
      );
    }

    // Só valida unicidade e atualiza se o telefone realmente mudou.
    // Isso evita falhas quando o admin salva sem mexer no input (ou quando o input tem formatação diferente).
    if (normalizedPhone !== normalizedTargetPhone) {
      const taken = await prisma.user.findFirst({
        where: { phone: normalizedPhone, id: { not: id } },
      });
      if (taken) {
        return NextResponse.json(
          { error: "Este telefone já está em uso por outro usuário." },
          { status: 409 }
        );
      }
      data.phone = normalizedPhone;
    }
  }

  if (typeof b.password === "string" && b.password.length > 0) {
    if (b.password.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter no mínimo 6 caracteres." },
        { status: 400 }
      );
    }
    data.passwordHash = await hashPassword(b.password);
  }

  if (typeof b.banned === "boolean") {
    if (b.banned && session!.userId === id) {
      return NextResponse.json(
        { error: "Você não pode suspender sua própria conta." },
        { status: 400 }
      );
    }
    data.banned = b.banned;
  }

  if (typeof b.sponsoredUser === "boolean") {
    data.sponsoredUser = b.sponsoredUser;
  }

  if (b.pixKeyType !== undefined) {
    data.pixKeyType =
      typeof b.pixKeyType === "string" && b.pixKeyType.trim() !== ""
        ? b.pixKeyType.trim()
        : null;
  }
  if (b.pixKey !== undefined) {
    data.pixKey =
      typeof b.pixKey === "string" && b.pixKey.trim() !== ""
        ? b.pixKey.trim()
        : null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nenhuma alteração enviada." }, { status: 400 });
  }

  try {
    await prisma.user.update({
      where: { id },
      data,
    });
  } catch (e) {
    logDevApiError("admin/users PATCH", e);
    return NextResponse.json(
      {
        error: "Erro ao atualizar usuário. Verifique se o telefone é único.",
        ...(devErrorDetail(e) ? { detalhe: devErrorDetail(e) } : {}),
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, message: "Usuário atualizado." });
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

  try {
    await ensureUserBannedColumnSqlite();
    await ensureUserCheckInColumnsSqlite();
  } catch {
    /* listagem já teria falhado; DELETE pode seguir sem banned na tabela antiga */
  }

  if (session!.userId === id) {
    return NextResponse.json(
      { error: "Você não pode excluir sua própria conta." },
      { status: 400 }
    );
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  try {
    await prisma.user.delete({ where: { id } });
  } catch (e) {
    console.error("Admin user DELETE:", e);
    return NextResponse.json(
      { error: "Erro ao excluir usuário." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, message: "Usuário excluído." });
}
