import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getEnv } from "@/server/env";

export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const safe = path.basename(name);
  if (safe !== name) return NextResponse.json({ error: "Invalid file" }, { status: 400 });
  const file = path.join(/* turbopackIgnore: true */ process.cwd(), getEnv().STORAGE_LOCAL_DIR, safe);
  try {
    const buffer = await readFile(file);
    const ext = path.extname(safe).toLowerCase();
    const type = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : ext === ".avif" ? "image/avif" : "image/jpeg";
    return new NextResponse(buffer, { headers: { "Content-Type": type, "Cache-Control": "public, max-age=86400" } });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
