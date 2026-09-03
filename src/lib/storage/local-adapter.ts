import fs from "node:fs/promises";
import path from "node:path";
import type { StorageAdapter, StorageUploadResult } from "@/lib/storage/types";

const UPLOAD_ROOT = "uploads";

/**
 * Dev-only: files under public/uploads/...
 * Public URL: /uploads/{key}
 */
export class LocalStorageAdapter implements StorageAdapter {
  private rootDir(): string {
    return path.join(process.cwd(), "public", UPLOAD_ROOT);
  }

  private filePathForKey(key: string): string {
    const safe = key.replace(/\.\./g, "").replace(/^\/+/, "");
    const parts = safe.split("/").filter(Boolean);
    if (parts.length === 0) throw new Error("Invalid storage key.");
    const full = path.join(this.rootDir(), ...parts);
    const root = this.rootDir();
    if (!full.startsWith(root)) {
      throw new Error("Invalid storage key.");
    }
    return full;
  }

  getPublicUrl(key: string): string {
    const safe = key.replace(/\.\./g, "").replace(/^\/+/, "");
    return `/${UPLOAD_ROOT}/${safe}`;
  }

  async upload(
    data: Buffer,
    key: string,
    options: { contentType: string }
  ): Promise<StorageUploadResult> {
    void options.contentType;
    const full = this.filePathForKey(key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, data);
    return { url: this.getPublicUrl(key), key };
  }

  async deleteByPublicUrl(publicUrl: string): Promise<void> {
    const t = publicUrl?.trim() ?? "";
    if (!t) return;
    try {
      const pathname = t.startsWith("http")
        ? new URL(t).pathname
        : t.split("?")[0];
      const prefix = `/${UPLOAD_ROOT}/`;
      if (!pathname.startsWith(prefix)) return;
      const key = decodeURIComponent(pathname.slice(prefix.length));
      const full = this.filePathForKey(key);
      await fs.unlink(full);
    } catch {
      /* missing or invalid */
    }
  }
}
