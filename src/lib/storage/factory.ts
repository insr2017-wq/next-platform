import { LocalStorageAdapter } from "@/lib/storage/local-adapter";
import { S3StorageAdapter } from "@/lib/storage/s3-adapter";
import type { StorageAdapter } from "@/lib/storage/types";
import { VercelBlobStorageAdapter } from "@/lib/storage/vercel-blob-adapter";

export type StorageProviderName = "s3" | "vercel-blob" | "local";

function isProductionLike(): boolean {
  return (
    process.env.VERCEL === "1" ||
    process.env.NODE_ENV === "production"
  );
}

function resolveProviderName(): StorageProviderName {
  const raw = process.env.STORAGE_PROVIDER?.trim().toLowerCase();
  if (raw === "s3" || raw === "vercel-blob" || raw === "local") {
    if (raw === "local" && isProductionLike()) {
      throw new Error(
        "STORAGE_PROVIDER=local is not allowed in production or on Vercel. Use s3 or vercel-blob."
      );
    }
    return raw;
  }
  if (isProductionLike()) {
    throw new Error(
      "STORAGE_PROVIDER must be set to \"s3\" or \"vercel-blob\" in production (and on Vercel)."
    );
  }
  return "local";
}

let cached: StorageAdapter | null = null;
let cachedName: StorageProviderName | null = null;

/**
 * Single shared adapter per runtime (env does not change hot).
 */
export function getStorageAdapter(): StorageAdapter {
  const name = resolveProviderName();
  if (cached && cachedName === name) return cached;
  cachedName = name;
  switch (name) {
    case "s3":
      cached = new S3StorageAdapter();
      break;
    case "vercel-blob":
      if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
        throw new Error(
          "BLOB_READ_WRITE_TOKEN is required when STORAGE_PROVIDER=vercel-blob."
        );
      }
      cached = new VercelBlobStorageAdapter();
      break;
    default:
      cached = new LocalStorageAdapter();
  }
  return cached;
}

export function getResolvedStorageProvider(): StorageProviderName {
  return resolveProviderName();
}
