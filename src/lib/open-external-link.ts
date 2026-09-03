import { toast } from "sonner";

/** Abre URL externa em nova aba; exibe toast se o link estiver vazio. */
export function openExternalLink(url: string, emptyMessage: string) {
  const trimmed = url.trim();
  if (!trimmed) {
    toast.error(emptyMessage);
    return;
  }
  const href = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  window.open(href, "_blank", "noopener,noreferrer");
}
