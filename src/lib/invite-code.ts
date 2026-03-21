/**
 * Generate a short unique invite code (numeric string for simplicity).
 * In production you might use a longer alphanumeric code.
 */
export function generateInviteCode(): string {
  const segment = () => Math.floor(1000 + Math.random() * 9000);
  return `${segment()}${segment()}`;
}
