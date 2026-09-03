import { normalizePhone } from "@/lib/phone-auth";

export type ParsedRegisterBody = {
  phone: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  inviteCode: string | null;
};

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Normaliza e valida o corpo do cadastro antes de qualquer chamada Prisma.
 * Evita findUnique/findFirst com tipos inválidos (causa comum de PrismaClientValidationError).
 */
export function parseRegisterBody(body: unknown):
  | { ok: true; data: ParsedRegisterBody }
  | { ok: false; error: string; status: number } {
  const b = (body ?? {}) as Record<string, unknown>;

  const phone = normalizePhone(readString(b.phone));
  if (!phone || phone.length < 10 || phone.length > 11) {
    return { ok: false, error: "Número de telefone inválido", status: 400 };
  }

  const password = readString(b.password);
  if (password.length < 6) {
    return { ok: false, error: "Senha deve ter no mínimo 6 caracteres.", status: 400 };
  }

  const confirmPassword = readString(b.confirmPassword);
  if (password !== confirmPassword) {
    return { ok: false, error: "As senhas não coincidem.", status: 400 };
  }

  const inviteRaw = readString(b.inviteCode);
  const inviteCode = inviteRaw ? inviteRaw.toUpperCase() : null;

  return {
    ok: true,
    data: {
      phone,
      password,
      confirmPassword,
      fullName: readString(b.fullName),
      inviteCode,
    },
  };
}
