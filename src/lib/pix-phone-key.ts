/** Dígitos locais BR (DDD + número), sem código do país. */
export function extractLocalPhoneDigits(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("+55")) {
    return trimmed.slice(3).replace(/\D/g, "");
  }
  const digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    return digits.slice(2);
  }
  return digits;
}

export function isValidLocalPhoneDigits(digits: string): boolean {
  return digits.length === 10 || digits.length === 11;
}

/** Persistência/API: +5521997826842 (não duplica +55). */
export function normalizePixPhoneKeyForStorage(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("+55")) {
    const local = trimmed.slice(3).replace(/\D/g, "");
    return `+55${local}`;
  }
  const local = extractLocalPhoneDigits(raw);
  return `+55${local}`;
}

export function formatPixPhoneKeyForVizzionPay(storedOrRaw: string): string {
  return normalizePixPhoneKeyForStorage(storedOrRaw);
}
