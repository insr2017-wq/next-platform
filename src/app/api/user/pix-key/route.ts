import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureUserPixColumnsSqlite } from "@/lib/user-schema-sqlite";

function normalizeDigits(v: string): string {
  return v.replace(/\D/g, "");
}

function validateCpfDigits(digits: string): boolean {
  // Validação básica: apenas formato (11 dígitos)
  return digits.length === 11;
}

function validatePhoneDigits(digits: string): boolean {
  // Validação básica: Brasil (10 ou 11 dígitos)
  return digits.length === 10 || digits.length === 11;
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "user") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    await ensureUserPixColumnsSqlite();
  } catch {
    // Se falhar preparar esquema, ainda vamos tentar atualizar (DB pode já estar ok).
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const b = (body ?? {}) as {
    pixKeyType?: string;
    pixKey?: string;
    holderName?: string;
    holderCpf?: string;
  };

  const pixKeyTypeRaw = typeof b.pixKeyType === "string" ? b.pixKeyType.trim() : "";
  const pixKeyRaw = typeof b.pixKey === "string" ? b.pixKey.trim() : "";

  const pixKeyType = pixKeyTypeRaw === "cpf" ? "cpf" : pixKeyTypeRaw === "telefone" ? "telefone" : "";
  if (!pixKeyType) {
    return NextResponse.json({ error: "Tipo de chave Pix inválido." }, { status: 400 });
  }
  if (!pixKeyRaw) {
    return NextResponse.json({ error: "Informe a chave Pix." }, { status: 400 });
  }

  const digits = normalizeDigits(pixKeyRaw);
  if (pixKeyType === "cpf") {
    if (!validateCpfDigits(digits)) {
      return NextResponse.json({ error: "CPF inválido (formato)."} , { status: 400 });
    }
  }
  if (pixKeyType === "telefone") {
    if (!validatePhoneDigits(digits)) {
      return NextResponse.json({ error: "Telefone inválido (formato)."} , { status: 400 });
    }
  }

  const holderName = typeof b.holderName === "string" ? b.holderName.trim() : "";
  const holderCpfRaw = typeof b.holderCpf === "string" ? b.holderCpf : "";
  const holderCpfDigits = normalizeDigits(holderCpfRaw);

  if (!holderName) {
    return NextResponse.json({ error: "Informe o nome do titular." }, { status: 400 });
  }
  // Validação básica do CPF do titular: apenas formato (11 dígitos)
  if (!validateCpfDigits(holderCpfDigits)) {
    return NextResponse.json({ error: "CPF do titular inválido (formato)." }, { status: 400 });
  }

  // Salva no banco (normalizado).
  await prisma.user.update({
    where: { id: session.userId },
    data: {
      pixKeyType,
      pixKey: digits,
      holderName,
      holderCpf: holderCpfDigits,
    },
  });

  return NextResponse.json({ success: true, message: "Chave Pix salva com sucesso." });
}

export async function DELETE() {
  const session = await getSession();
  if (!session || session.role !== "user") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    await prisma.user.update({
      where: { id: session.userId },
      data: {
        pixKeyType: null,
        pixKey: null,
        holderName: null,
        holderCpf: null,
      },
    });
  } catch (e) {
    console.error("user/pix-key DELETE:", e);
    return NextResponse.json({ error: "Erro ao remover a chave Pix." }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Chave Pix removida." });
}

