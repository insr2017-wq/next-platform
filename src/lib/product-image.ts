import { getStorageAdapter } from "@/lib/storage";

/** Legacy local URL prefix (public/uploads → /uploads/...) */
export const PRODUCT_UPLOAD_URL_PREFIX = "/uploads/products";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

/** Object key: products/{productId}{ext} — no leading slash. */
export function buildProductImageKey(productId: string, ext: string): string {
  const id = sanitizeProductId(productId);
  const e = ext.startsWith(".") ? ext : `.${ext}`;
  return `products/${id}${e}`;
}

function sanitizeProductId(productId: string): string {
  const id = productId.trim();
  if (!/^[a-z0-9]+$/i.test(id) || id.length > 64) {
    throw new Error("Identificador de produto inválido.");
  }
  return id;
}

export function isVercelBlobProductImageUrl(url: string): boolean {
  const t = url?.trim() ?? "";
  if (!t.startsWith("https://")) return false;
  try {
    const u = new URL(t);
    return u.hostname.includes("blob.vercel-storage.com");
  } catch {
    return false;
  }
}

/** Paths we uploaded (local, Blob, or S3-style products/... keys in URL path). */
export function isManagedProductImage(url: string): boolean {
  const t = url?.trim() ?? "";
  if (!t) return false;
  if (t.startsWith(`${PRODUCT_UPLOAD_URL_PREFIX}/`)) return true;
  if (isVercelBlobProductImageUrl(t)) return true;
  try {
    const u = new URL(t);
    return /^\/products\/[a-z0-9]+\.(jpe?g|png|webp|gif)$/i.test(u.pathname);
  } catch {
    return false;
  }
}

/** @deprecated use isManagedProductImage */
export function isStoredProductImage(url: string): boolean {
  return (url?.trim() ?? "").startsWith(`${PRODUCT_UPLOAD_URL_PREFIX}/`);
}

/**
 * Validate image, upload via configured storage adapter, return public URL for the database.
 */
export async function saveProductImageFile(productId: string, file: File): Promise<string> {
  if (!file || file.size === 0) {
    throw new Error("Nenhum arquivo enviado.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Imagem muito grande (máx. 5 MB).");
  }
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    throw new Error("Use JPG, PNG, WebP ou GIF.");
  }

  const key = buildProductImageKey(productId, ext);
  const buf = Buffer.from(await file.arrayBuffer());
  const adapter = getStorageAdapter();
  const { url } = await adapter.upload(buf, key, {
    contentType: file.type,
  });
  return url;
}

export async function deleteProductImageByUrl(imageUrl: string): Promise<void> {
  const t = imageUrl?.trim() ?? "";
  if (!t || !isManagedProductImage(t)) return;
  const adapter = getStorageAdapter();
  await adapter.deleteByPublicUrl(t);
}
