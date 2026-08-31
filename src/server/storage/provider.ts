import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { getEnv } from "@/server/env";
import { validateImageUpload } from "@/server/image";

export interface StoredFile {
  storedName: string;
  url: string;
  mimeType: string;
  byteSize: number;
}

export interface StorageProvider {
  put(input: { buffer: Buffer; mimeType: string; originalName: string }): Promise<StoredFile>;
  remove(storedName: string): Promise<void>;
}

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export class LocalStorageProvider implements StorageProvider {
  constructor(private dir = getEnv().STORAGE_LOCAL_DIR) {}

  async put(input: { buffer: Buffer; mimeType: string; originalName: string }): Promise<StoredFile> {
    validateImageUpload({
      mimeType: input.mimeType,
      size: input.buffer.byteLength,
      originalName: input.originalName,
      buffer: input.buffer,
    });
    const storedName = `${Date.now()}-${randomBytes(8).toString("hex")}.${EXT[input.mimeType]}`;
    const abs = path.join(/* turbopackIgnore: true */ process.cwd(), this.dir);
    await mkdir(abs, { recursive: true });
    await writeFile(path.join(abs, storedName), input.buffer);
    return {
      storedName,
      url: `/api/media/${storedName}`,
      mimeType: input.mimeType,
      byteSize: input.buffer.byteLength,
    };
  }

  async remove(storedName: string) {
    const safe = path.basename(storedName);
    await unlink(path.join(/* turbopackIgnore: true */ process.cwd(), this.dir, safe)).catch(() => undefined);
  }
}

export class S3StorageProvider implements StorageProvider {
  async put(): Promise<StoredFile> {
    throw new Error("S3 storage is not configured. Local storage is not appropriate for serverless production.");
  }
  async remove(): Promise<void> {
    throw new Error("S3 storage is not configured.");
  }
}

export function storage(): StorageProvider {
  return getEnv().STORAGE_DRIVER === "s3" ? new S3StorageProvider() : new LocalStorageProvider();
}
