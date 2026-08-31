import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { OneEpinClient } from "@/server/suppliers/1epin/client";
import { resolveOneEpinConfig, credentialsConfigured } from "@/server/suppliers/1epin/config";
import { reconcileStaleSupplierOrders } from "@/server/suppliers/1epin/reconciliation";

export const dynamic = "force-dynamic";

function tokenOk(header: string | null, expected: string) {
  const provided = header?.replace(/^Bearer\s+/i, "") ?? "";
  if (!expected || expected.length < 16 || provided.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

export async function POST(request: Request) {
  const expected = process.env.ONEEPIN_RECONCILE_TOKEN ?? "";
  if (!tokenOk(request.headers.get("authorization"), expected)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!credentialsConfigured()) {
    return NextResponse.json({ error: "1Epin credentials are not configured." }, { status: 503 });
  }
  const client = new OneEpinClient(resolveOneEpinConfig());
  const result = await reconcileStaleSupplierOrders(client);
  return NextResponse.json({ ok: true, ...result });
}
