/** Abre URL externa em nova aba. Retorna false se o link estiver vazio. */
export function openExternalLink(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  const href = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  window.open(href, "_blank", "noopener,noreferrer");
  return true;
}
