import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { StorageAdapter, StorageUploadResult } from "@/lib/storage/types";

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

/**
 * S3-compatible storage (AWS S3, MinIO, Cloudflare R2, DigitalOcean Spaces, etc.)
 */
export class S3StorageAdapter implements StorageAdapter {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBase: string;

  constructor() {
    const region = process.env.S3_REGION?.trim() || "us-east-1";
    const endpoint = process.env.S3_ENDPOINT?.trim();
    const accessKeyId = requireEnv("S3_ACCESS_KEY_ID");
    const secretAccessKey = requireEnv("S3_SECRET_ACCESS_KEY");
    this.bucket = requireEnv("S3_BUCKET");

    const forcePathStyle =
      process.env.S3_FORCE_PATH_STYLE?.trim() === "true" ||
      process.env.S3_FORCE_PATH_STYLE === "1";

    this.client = new S3Client({
      region,
      endpoint: endpoint || undefined,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle,
    });

    const customPublic = process.env.S3_PUBLIC_URL?.trim().replace(/\/$/, "");
    if (customPublic) {
      this.publicBase = customPublic;
    } else if (!endpoint) {
      this.publicBase = `https://${this.bucket}.s3.${region}.amazonaws.com`;
    } else {
      throw new Error(
        "S3_PUBLIC_URL is required when using a custom S3_ENDPOINT (MinIO, R2, Spaces, etc.)."
      );
    }
  }

  getPublicUrl(key: string): string {
    const safe = key.replace(/\.\./g, "").replace(/^\/+/, "");
    return `${this.publicBase}/${safe}`;
  }

  async upload(
    data: Buffer,
    key: string,
    options: { contentType: string }
  ): Promise<StorageUploadResult> {
    const safeKey = key.replace(/\.\./g, "").replace(/^\/+/, "");
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: safeKey,
        Body: data,
        ContentType: options.contentType,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );
    return { url: this.getPublicUrl(safeKey), key: safeKey };
  }

  async deleteByPublicUrl(publicUrl: string): Promise<void> {
    const t = publicUrl?.trim() ?? "";
    if (!t) return;
    let key: string | null = null;
    if (t.startsWith(this.publicBase)) {
      key = t.slice(this.publicBase.length).replace(/^\//, "");
    } else {
      try {
        const u = new URL(t);
        const baseOrigin = new URL(this.publicBase).origin;
        if (u.origin === baseOrigin) {
          key = u.pathname.replace(/^\//, "") || null;
        }
      } catch {
        return;
      }
    }
    if (!key || key.includes("..")) return;
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );
    } catch {
      /* already gone */
    }
  }
}
