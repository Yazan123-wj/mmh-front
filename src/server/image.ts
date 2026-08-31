import path from "path";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp", "avif"]);
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MIN_IMAGE_PX = 64;
export const MAX_IMAGE_PX = 8000;

export function validateImageUpload(input: { mimeType: string; size: number; originalName: string; buffer?: Buffer }) {
  if (!ALLOWED.has(input.mimeType)) throw new Error("Unsupported image type.");
  if (input.size > MAX_IMAGE_BYTES) throw new Error("Image exceeds 5MB.");
  if (input.size < 32) throw new Error("Image file is empty.");
  const ext = path.extname(input.originalName).toLowerCase().replace(".", "");
  if (ext && !ALLOWED_EXT.has(ext)) throw new Error("Invalid extension.");
  if (input.buffer) {
    const dimensions = readImageSize(input.buffer, input.mimeType);
    if (dimensions) {
      if (dimensions.width < MIN_IMAGE_PX || dimensions.height < MIN_IMAGE_PX) {
        throw new Error("Image is too small.");
      }
      if (dimensions.width > MAX_IMAGE_PX || dimensions.height > MAX_IMAGE_PX) {
        throw new Error("Image is too large.");
      }
    }
  }
}

export function readImageSize(buffer: Buffer, mimeType: string): { width: number; height: number } | null {
  try {
    if (mimeType === "image/png" && buffer.length >= 24) {
      return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
    }
    if (mimeType === "image/webp" && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.length >= 30) {
      if (buffer.toString("ascii", 8, 12) === "WEBP" && buffer.toString("ascii", 12, 16) === "VP8 ") {
        return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
      }
    }
  } catch {
    return null;
  }
  return null;
}
