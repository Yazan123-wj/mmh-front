"use client";

import { Badge } from "@/components/admin/ui/badge";
import { EmptyState } from "@/components/admin/ui/empty-state";
import { ErrorState } from "@/components/admin/ui/error-state";
import { PageHeader } from "@/components/admin/ui/page-header";
import { formatAdminDateTime } from "@/lib/admin/format";
import { useAdminQuery } from "@/hooks/use-admin-query";
import { getSupplier } from "@/lib/api/admin";
import Link from "next/link";

export function SupplierDetailClient({ id }: { id: string }) {
  const { data: supplier, loading, error, reload } = useAdminQuery((token) => getSupplier(token, id), [id]);

  if (loading) return <div className="h-40 animate-pulse rounded-xl border border-[var(--clicks-border)] bg-white" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!supplier) return <EmptyState title="Supplier not found" />;

  return (
    <div>
      <PageHeader
        title={supplier.name}
        description={supplier.slug}
        actions={
          <Link href="/admin/suppliers" className="text-sm font-medium text-[var(--clicks-blue)]">
            Back to suppliers
          </Link>
        }
      />
      {supplier.live_locked ? (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-semibold uppercase tracking-wide">Live locked</p>
          <p className="mt-1">Live supplier mode is disabled in this phase.</p>
        </div>
      ) : null}
      <div className="rounded-xl border border-[var(--clicks-border)] bg-white p-5 text-sm">
        <div className="flex flex-wrap items-center gap-3">
          <Badge status={supplier.active ? "ACTIVE" : "DISABLED"} />
          {supplier.environment ? <Badge tone="info">{supplier.environment}</Badge> : null}
          <span className="text-[var(--clicks-muted)]">
            Last checked {formatAdminDateTime(supplier.last_checked_at)}
          </span>
        </div>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--clicks-muted)]">Balance</dt>
            <dd className="mt-1">{supplier.last_balance || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--clicks-muted)]">Credentials</dt>
            <dd className="mt-1">
              {[
                supplier.email_configured ? "email" : null,
                supplier.password_configured ? "password" : null,
                supplier.callback_configured ? "callback" : null,
              ]
                .filter(Boolean)
                .join(", ") || "Not configured"}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
