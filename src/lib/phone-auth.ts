export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").trim();
}

/** Variações comuns (BR): com e sem DDI 55, para bater com o que está no banco. */
export function phoneLookupVariants(digits: string): string[] {
  const v = new Set<string>();
  if (!digits) return [];
  v.add(digits);
  if (digits.length === 13 && digits.startsWith("55")) {
    v.add(digits.slice(2));
  }
  if (digits.length === 11) {
    v.add(`55${digits}`);
  }
  return [...v];
}
