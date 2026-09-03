export const HOLDER_NAME_INVALID_MESSAGE =
  "Use apenas letras sem acentos ou caracteres especiais";

/** Permite apenas letras ASCII e espaços (durante digitação). */
const HOLDER_NAME_INPUT_PATTERN = /^[A-Za-z ]*$/;

/** Nome válido após trim: letras e espaços entre palavras. */
const HOLDER_NAME_VALUE_PATTERN = /^[A-Za-z]+(?: [A-Za-z]+)*$/;

export function isHolderNameInputAllowed(value: string): boolean {
  return HOLDER_NAME_INPUT_PATTERN.test(value);
}

export function isValidHolderName(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return HOLDER_NAME_VALUE_PATTERN.test(trimmed);
}

export function validateHolderName(
  value: string
): { ok: true; value: string } | { ok: false; error: string } {
  if (!value.trim()) {
    return { ok: false, error: "Informe o nome do titular." };
  }
  if (!isHolderNameInputAllowed(value) || !isValidHolderName(value)) {
    return { ok: false, error: HOLDER_NAME_INVALID_MESSAGE };
  }
  return { ok: true, value: value.trim() };
}
