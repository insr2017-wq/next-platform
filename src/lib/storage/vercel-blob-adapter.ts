import { del, put } from "@vercel/blob";
import type { StorageAdapter, StorageUploadResult } from "@/lib/storage/types";

/**
 * Vercel Blob — uses BLOB_READ_WRITE_TOKEN from the environment.
 */
export class VercelBlobStorageAdapter implements StorageAdapter {
  getPublicUrl(key: string): string {
    void key;
    throw new Error("Vercel Blob URLs are returned from upload(); use that URL in the database.");
  }

  async upload(
    data: Buffer,
    key: string,
    options: { contentType: string }
  ): Promise<StorageUploadResult> {
    const safeKey = key.replace(/\.\./g, "").replace(/^\/+/, "");
    const body = new Blob([new Uint8Array(data)], { type: options.contentType });
    const blob = await put(safeKey, body, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: options.contentType,
    });
    return { url: blob.url, key: safeKey };
  }

  async deleteByPublicUrl(publicUrl: string): Promise<void> {
    const t = publicUrl?.trim() ?? "";
    if (!t || !this.isBlobUrl(t)) return;
    try {
      await del(t);
    } catch {
      /* already removed */
    }
  }

  private isBlobUrl(url: string): boolean {
    try {
      const u = new URL(url);
      return u.hostname.includes("blob.vercel-storage.com");
    } catch {
      return false;
    }
  }
}
