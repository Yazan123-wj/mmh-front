"use client";

import { Badge } from "@/components/admin/ui/badge";
import { AdminCard, AdminSectionHeader } from "@/components/admin/ui/card";
import { ErrorState } from "@/components/admin/ui/error-state";
import { PageHeader } from "@/components/admin/ui/page-header";
import { useAdminToast } from "@/components/admin/ui/toast";
import { formatAdminDateTime } from "@/lib/admin/format";
import { useAdminQuery } from "@/hooks/use-admin-query";
import { getOneEpinBalance, getOneEpinStatus, pingOneEpin, syncOneEpin } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import Link from "next/link";
import { useState } from "react";

export function OneEpinClient() {
  const toast = useAdminToast();
  const [busy, setBusy] = useState(false);
  const { data, setData, loading, error, reload, token } = useAdminQuery(async (tok) => {
    const [st, bal] = await Promise.all([
      getOneEpinStatus(tok),
      getOneEpinBalance(tok).catch(() => ({ balance: null as number | null, last_balance: null })),
    ]);
    return {
      status: st,
      balance: bal.balance ?? bal.last_balance ?? st.last_balance ?? null,
    };
  });

  const status = data?.status ?? null;
  const balance = data?.balance ?? null;

  async function run(action: "ping" | "sync") {
    if (!token) return;
    setBusy(true);
    try {
      if (action === "ping") {
        const next = await pingOneEpin(token);
        setData((prev) => ({
          status: next,
          balance: prev?.balance ?? next.last_balance ?? null,
        }));
        toast.push("Ping succeeded", "success");
      } else {
        await syncOneEpin(token);
        toast.push("Sync started", "success");
        reload();
      }
    } catch (err) {
      toast.push(err instanceof ApiError ? err.message : "Action failed", "error");
    } finally {
      setBusy(false);
    }
  }

  const liveLocked = status?.live_locked !== false;

  return (
    <div>
      <PageHeader
        title="OneEpin"
        description="Supplier connection, balance, and catalog sync. Live purchasing remains locked."
        actions={
          <Link href="/admin/integrations/1epin/logs" className="admin-btn admin-btn-secondary">
            View logs
          </Link>
        }
      />

      {liveLocked ? (
        <div className="mb-4 flex flex-wrap items-start gap-3 rounded-[var(--admin-radius)] border border-amber-200 bg-amber-50/80 px-4 py-3">
          <Badge status="LIVE_LOCKED">Live locked</Badge>
          <p className="min-w-0 flex-1 text-[13px] text-amber-950">
            Only mock/test environments are available. Live credentials and live purchases cannot be enabled until
            payment integration and an explicit go-live decision.
          </p>
        </div>
      ) : null}

      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {loading ? <div className="admin-card h-40 animate-pulse" /> : null}
      {!loading && !error && status ? (
        <div className="grid gap-3 lg:grid-cols-3">
          <AdminCard className="lg:col-span-2" padding="md">
            <AdminSectionHeader title="Connection" />
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={status.email_configured || status.ok || status.configured ? "success" : "warning"}>
                {status.email_configured || status.configured ? "Configured" : "Not configured"}
              </Badge>
              {status.mode ? <Badge tone="info">{String(status.mode).toUpperCase()}</Badge> : null}
              {status.environment ? <Badge tone="neutral">{status.environment}</Badge> : null}
              {liveLocked ? <Badge status="LIVE_LOCKED">Live locked</Badge> : null}
            </div>
            {status.detail ? <p className="mt-3 text-[13px] text-[var(--clicks-muted)]">{status.detail}</p> : null}
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" disabled={busy} onClick={() => void run("ping")} className="admin-btn admin-btn-primary">
                Test connection
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void run("sync")}
                className="admin-btn admin-btn-secondary"
              >
                Sync catalog
              </button>
            </div>
          </AdminCard>

          <AdminCard padding="md">
            <AdminSectionHeader title="Balance" />
            <p className="text-[1.5rem] font-semibold tabular-nums text-[var(--clicks-navy)]">{balance ?? "—"}</p>
            <p className="mt-2 text-[11px] text-[var(--clicks-muted)]">
              Last checked {formatAdminDateTime(status.last_checked_at || status.last_ping_at) || "—"}
            </p>
          </AdminCard>
        </div>
      ) : null}
    </div>
  );
}
