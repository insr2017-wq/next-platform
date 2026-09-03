/**
 * Masks phone for display: show prefix (first 2), one middle digit, then ****, then last 4.
 * Example: 8998148533 → "89 9****8533"
 * Safe: returns fallback if phone is null/undefined.
 */
export function maskPhone(phone: string | null | undefined): string {
  if (phone == null || typeof phone !== "string") return "—";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7) return phone || "—";
  const prefix = digits.slice(0, 2);
  const middleChar = digits[2];
  const last4 = digits.slice(-4);
  return `${prefix} ${middleChar}****${last4}`;
}
