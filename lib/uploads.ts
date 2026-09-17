import { promises as fs } from "fs";
import path from "path";

export const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
export const UPLOAD_PREFIX = "/api/uploads/";
export const MAX_IMAGES = 10;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

const NAME_RE = /^[a-f0-9-]{36}\.(jpg|png|webp|avif)$/;

export const isUploadName = (name: string) => NAME_RE.test(name);

export const isUploadUrl = (value: unknown): value is string =>
  typeof value === "string" &&
  value.startsWith(UPLOAD_PREFIX) &&
  isUploadName(value.slice(UPLOAD_PREFIX.length));

/** Удаляет файлы, на которые больше не ссылается товар */
export async function removeUploads(urls: string[]): Promise<void> {
  await Promise.all(
    urls.filter(isUploadUrl).map((url) =>
      fs.unlink(path.join(UPLOAD_DIR, url.slice(UPLOAD_PREFIX.length))).catch(() => undefined),
    ),
  );
}
