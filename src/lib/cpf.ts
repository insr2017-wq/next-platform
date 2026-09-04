/** Apenas dígitos (entrada de CPF). */
export function normalizeCpfInput(v: string): string {
  return v.replace(/\D/g, "");
}

function verifierDigit(digits: number[], factorStart: number): number {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    sum += digits[i]! * (factorStart - i);
  }
  const r = (sum * 10) % 11;
  return r === 10 || r === 11 ? 0 : r;
}

/** CPF com 11 dígitos e dígitos verificadores válidos. */
export function isValidCpfDigits(digits: string): boolean {
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;
  const n = digits.split("").map((d) => parseInt(d, 10));
  if (verifierDigit(n.slice(0, 9), 10) !== n[9]) return false;
  return verifierDigit(n.slice(0, 10), 11) === n[10];
}

/** CPF aleatório com dígitos verificadores válidos (uso interno do gateway de depósito). */
export function generateValidCpfDigits(): string {
  for (let attempt = 0; attempt < 20; attempt++) {
    const n = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
    if (n.every((d) => d === n[0])) continue;
    const d1 = verifierDigit(n, 10);
    const d2 = verifierDigit([...n, d1], 11);
    const digits = [...n, d1, d2].join("");
    if (isValidCpfDigits(digits)) return digits;
  }
  return "39053344705";
}

/** Alias usado pelo depósito VQPay. */
export const generateRandomValidCpf = generateValidCpfDigits;
