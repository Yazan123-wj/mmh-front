import { NextResponse } from "next/server";
import { acceptCallback } from "@/server/suppliers/1epin/callbacks";
import { OneEpinClient } from "@/server/suppliers/1epin/client";
import { resolveOneEpinConfig, credentialsConfigured } from "@/server/suppliers/1epin/config";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const expected = process.env.ONEEPIN_CALLBACK_TOKEN ?? "";
  const length = Number(request.headers.get("content-length") ?? 0);
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    return new NextResponse("Invalid payload", { status: 400 });
  }
  let client: OneEpinClient | null = null;
  if (credentialsConfigured()) {
    try {
      client = new OneEpinClient(resolveOneEpinConfig());
    } catch {
      client = null;
    }
  }
  const result = await acceptCallback({
    token,
    expectedToken: expected,
    body,
    client,
    ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip"),
    contentLength: length,
  });
  return new NextResponse(result.body, {
    status: result.status,
    headers: { "Content-Type": "text/plain" },
  });
}
