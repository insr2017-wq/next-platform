/**
 * Logs estruturados do fluxo Pix VizzionPay (servidor).
 * Nunca registrar chaves secretas nem o corpo completo de credenciais.
 */

const PREFIX = "[VizzionPay PIX]";

export function maskDocumentForLog(documentDigits: string): string {
  const d = documentDigits.replace(/\D/g, "");
  if (d.length <= 4) return "(muito curto)";
  return `***${d.slice(-4)} (len=${d.length})`;
}

export type ClientLogShape = {
  name: string;
  email: string;
  phone: string;
  documentMasked: string;
  documentSource: "cpf11" | "phone_tail" | "placeholder" | "phone_only";
  phoneDigitsLength: number;
  syntheticEmail: boolean;
  emailHost: string;
};

export function buildClientLogSnapshot(input: {
  name: string;
  email: string;
  phone: string;
  document: string;
  syntheticEmail: boolean;
  emailHost: string;
  documentSource: ClientLogShape["documentSource"];
  phoneDigitsLength: number;
}): ClientLogShape {
  return {
    name: input.name,
    email: input.email,
    phone: input.phone,
    documentMasked: maskDocumentForLog(input.document),
    documentSource: input.documentSource,
    phoneDigitsLength: input.phoneDigitsLength,
    syntheticEmail: input.syntheticEmail,
    emailHost: input.emailHost,
  };
}

export function logVizzionPayPixEvent(
  step: string,
  data: Record<string, unknown>
): void {
  const line = { step, t: new Date().toISOString(), ...data };
  console.log(PREFIX, JSON.stringify(line));
}

export function logVizzionPayPixWarn(
  step: string,
  data: Record<string, unknown>
): void {
  const line = { step, t: new Date().toISOString(), ...data };
  console.warn(PREFIX, JSON.stringify(line));
}

export function logVizzionPayPixError(
  step: string,
  data: Record<string, unknown>
): void {
  const line = { step, t: new Date().toISOString(), ...data };
  console.error(PREFIX, JSON.stringify(line));
}

/** Limita tamanho de corpo textual em logs (Vercel). */
export function truncateForLog(text: string, max = 8_000): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…(truncado, total=${text.length})`;
}
