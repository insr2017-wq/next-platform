import fs from "node:fs/promises";
import path from "node:path";

export const PRODUCT_UPLOAD_URL_PREFIX = "/uploads/products";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export function getProductUploadDir(): string {
  return path.join(process.cwd(), "public", "uploads", "products");
}

export async function ensureProductUploadDir(): Promise<void> {
  await fs.mkdir(getProductUploadDir(), { recursive: true });
}

export async function saveProductImageFile(
  productId: string,
  file: File
): Promise<string> {
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
  await ensureProductUploadDir();
  const filename = `${productId}${ext}`;
  const fullPath = path.join(getProductUploadDir(), filename);
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(fullPath, buf);
  return `${PRODUCT_UPLOAD_URL_PREFIX}/${filename}`;
}

export async function deleteProductImageByUrl(imageUrl: string): Promise<void> {
  const t = imageUrl?.trim() ?? "";
  if (!t.startsWith(`${PRODUCT_UPLOAD_URL_PREFIX}/`)) return;
  const base = path.basename(t);
  if (!base || base.includes("..") || base.includes("/") || base.includes("\\")) {
    return;
  }
  const full = path.join(getProductUploadDir(), base);
  if (!full.startsWith(getProductUploadDir())) return;
  try {
    await fs.unlink(full);
  } catch {
    /* arquivo já removido */
  }
}

export function isStoredProductImage(url: string): boolean {
  return (url?.trim() ?? "").startsWith(`${PRODUCT_UPLOAD_URL_PREFIX}/`);
}
