/**
 * Storage abstraction for product images (and future uploads).
 * Provider is selected via STORAGE_PROVIDER (s3 | vercel-blob | local).
 */

export type StorageUploadOptions = {
  contentType: string;
};

export type StorageUploadResult = {
  /** Full public URL to persist in the database */
  url: string;
  /** Object key/path within the bucket or store (e.g. products/cuid.webp) */
  key: string;
};

export interface StorageAdapter {
  /** Upload bytes to a stable object key; returns public URL. */
  upload(
    data: Buffer,
    key: string,
    options: StorageUploadOptions
  ): Promise<StorageUploadResult>;

  /**
   * Remove object referenced by the same public URL returned from upload.
   * Must be safe no-op if URL is external or already deleted.
   */
  deleteByPublicUrl(publicUrl: string): Promise<void>;

  /** Build public URL for a key (used internally; DB should store full URL from upload result). */
  getPublicUrl(key: string): string;
}
