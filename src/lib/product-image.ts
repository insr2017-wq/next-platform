import fs from "node:fs/promises";
import path from "node:path";
import { del, put } from "@vercel/blob";

export const PRODUCT_UPLOAD_URL_PREFIX = "/uploads/products";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

function hasBlobToken(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

/** URLs públicas do Vercel Blob (produção serverless). */
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

/** Imagem gerenciada por nós (disco local em dev ou Blob em produção). */
export function isManagedProductImage(url: string): boolean {
  const t = url?.trim() ?? "";
  if (!t) return false;
  if (t.startsWith(`${PRODUCT_UPLOAD_URL_PREFIX}/`)) return true;
  return isVercelBlobProductImageUrl(t);
}

/** @deprecated use isManagedProductImage — mantido para compat. */
export function isStoredProductImage(url: string): boolean {
  return (url?.trim() ?? "").startsWith(`${PRODUCT_UPLOAD_URL_PREFIX}/`);
}

export function getProductUploadDir(): string {
  return path.join(process.cwd(), "public", "uploads", "products");
}

export async function ensureProductUploadDir(): Promise<void> {
  await fs.mkdir(getProductUploadDir(), { recursive: true });
}

async function saveProductImageToLocalDisk(productId: string, file: File, ext: string): Promise<string> {
  await ensureProductUploadDir();
  const filename = `${productId}${ext}`;
  const fullPath = path.join(getProductUploadDir(), filename);
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(fullPath, buf);
  return `${PRODUCT_UPLOAD_URL_PREFIX}/${filename}`;
}

async function saveProductImageToVercelBlob(productId: string, file: File, ext: string): Promise<string> {
  const pathname = `products/${productId}${ext}`;
  const blob = await put(pathname, file, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return blob.url;
}

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

  if (hasBlobToken()) {
    return saveProductImageToVercelBlob(productId, file, ext);
  }

  if (process.env.VERCEL) {
    throw new Error(
      "Armazenamento em disco não está disponível na Vercel. Crie um store em vercel.com/storage/blob, ligue ao projeto e defina a variável BLOB_READ_WRITE_TOKEN no ambiente."
    );
  }

  return saveProductImageToLocalDisk(productId, file, ext);
}

export async function deleteProductImageByUrl(imageUrl: string): Promise<void> {
  const t = imageUrl?.trim() ?? "";
  if (!t) return;

  if (isVercelBlobProductImageUrl(t)) {
    try {
      await del(t);
    } catch {
      /* já removido ou URL inválida */
    }
    return;
  }

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
