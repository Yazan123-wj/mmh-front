"use client";

import { Badge } from "@/components/admin/ui/badge";
import { EmptyState } from "@/components/admin/ui/empty-state";
import { ErrorState } from "@/components/admin/ui/error-state";
import { PageHeader } from "@/components/admin/ui/page-header";
import { formatAdminDateTime } from "@/lib/admin/format";
import { useAdminQuery } from "@/hooks/use-admin-query";
import { getCustomer } from "@/lib/api/admin";
import Link from "next/link";

export function CustomerDetailClient({ id }: { id: string }) {
  const { data: customer, loading, error, reload } = useAdminQuery((token) => getCustomer(token, id), [id]);

  if (loading) return <div className="h-40 animate-pulse rounded-xl border border-[var(--clicks-border)] bg-white" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!customer) return <EmptyState title="Customer not found" />;

  return (
    <div>
      <PageHeader
        title={customer.name || customer.email}
        description={customer.email}
        actions={
          <Link href="/admin/customers" className="text-sm font-medium text-[var(--clicks-blue)]">
            Back to customers
          </Link>
        }
      />
      <div className="rounded-xl border border-[var(--clicks-border)] bg-white p-5 text-sm">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--clicks-muted)]">Status</dt>
            <dd className="mt-1">
              <Badge status={customer.status || "ACTIVE"} />
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--clicks-muted)]">Phone</dt>
            <dd className="mt-1">{customer.phone || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--clicks-muted)]">Locale</dt>
            <dd className="mt-1">{customer.locale || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--clicks-muted)]">Joined</dt>
            <dd className="mt-1">{formatAdminDateTime(customer.created_at)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
