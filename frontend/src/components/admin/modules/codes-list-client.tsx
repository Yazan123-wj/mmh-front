"use client";

import { ADMIN_LIST_PAGE_SIZE } from "@/components/admin/admin-list-page";
import { AdminModal } from "@/components/admin/ui/admin-modal";
import { Badge } from "@/components/admin/ui/badge";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { DataTable } from "@/components/admin/ui/data-table";
import { EmptyState } from "@/components/admin/ui/empty-state";
import { ErrorState } from "@/components/admin/ui/error-state";
import { Filters } from "@/components/admin/ui/filters";
import { PageHeader } from "@/components/admin/ui/page-header";
import { Pagination } from "@/components/admin/ui/pagination";
import { useAdminToast } from "@/components/admin/ui/toast";
import { formatAdminDateTime } from "@/lib/admin/format";
import { useAdminResource } from "@/hooks/use-admin-resource";
import { listCodes, revealCode, type DigitalCodeRow } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import { hasPermission } from "@/server/auth/permissions";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export function CodesListClient() {
  const toast = useAdminToast();
  const session = useSession();
  const canReveal = hasPermission(
    session.data?.user?.permissions,
    "codes.reveal",
    session.data?.user?.role,
  );
  const canManage = hasPermission(
    session.data?.user?.permissions,
    "codes.manage",
    session.data?.user?.role,
  );
  const { token, page, setPage, search, setSearch, items, count, loading, error, reload } =
    useAdminResource<DigitalCodeRow>(async (tok, p, s) => {
      const data = await listCodes(tok, { page: p, page_size: ADMIN_LIST_PAGE_SIZE, search: s || undefined });
      return { items: data.results, count: data.count };
    });

  const [revealTarget, setRevealTarget] = useState<DigitalCodeRow | null>(null);
  const [plaintext, setPlaintext] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function confirmReveal() {
    if (!token || !revealTarget) return;
    setPending(true);
    try {
      const result = await revealCode(token, revealTarget.id);
      setPlaintext(result.code);
      setRevealTarget(null);
      toast.push("Code revealed", "success");
      await reload();
    } catch (err) {
      toast.push(err instanceof ApiError ? err.message : "Reveal failed", "error");
    } finally {
      setPending(false);
    }
  }

  function closePlaintext() {
    setPlaintext(null);
  }

  const columns = [
    { key: "masked", header: "Code", render: (r: DigitalCodeRow) => <span className="font-mono text-xs">{r.masked}</span> },
    { key: "sku", header: "SKU", render: (r: DigitalCodeRow) => r.variant_sku || "—" },
    { key: "order", header: "Order", render: (r: DigitalCodeRow) => r.order_number || "—" },
    { key: "status", header: "Status", render: (r: DigitalCodeRow) => <Badge status={r.status || "AVAILABLE"} /> },
    { key: "revealed", header: "Revealed", render: (r: DigitalCodeRow) => formatAdminDateTime(r.revealed_at) },
    ...(canReveal
      ? [
          {
            key: "actions",
            header: "",
            render: (r: DigitalCodeRow) => (
              <button
                type="button"
                className="text-xs font-medium text-[var(--clicks-blue)]"
                onClick={() => setRevealTarget(r)}
              >
                Reveal
              </button>
            ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <PageHeader
        title="Digital codes"
        description="Inventory codes (masked). Reveal requires codes.reveal."
        actions={
          canManage ? (
            <Link
              href="/admin/codes/import"
              className="inline-flex h-9 items-center rounded-lg bg-[var(--clicks-blue)] px-3 text-sm font-semibold text-white"
            >
              Import codes
            </Link>
          ) : null
        }
      />
      <Filters search={search} onSearchChange={setSearch} searchPlaceholder="Search codes…" />
      <DataTable
        columns={columns}
        rows={items}
        loading={loading}
        rowKey={(r) => String(r.id)}
        empty={<EmptyState title="No codes" />}
        error={error ? <ErrorState message={error} onRetry={reload} /> : null}
      />
      <Pagination page={page} pageSize={ADMIN_LIST_PAGE_SIZE} total={count} onPageChange={setPage} />

      <ConfirmDialog
        open={Boolean(revealTarget)}
        title="Reveal digital code?"
        description={
          revealTarget
            ? `This will decrypt and audit-log the reveal for masked code ${revealTarget.masked}. Only reveal when assisting a customer.`
            : undefined
        }
        confirmLabel="Reveal"
        pending={pending}
        onCancel={() => setRevealTarget(null)}
        onConfirm={() => void confirmReveal()}
      />

      <AdminModal open={Boolean(plaintext)} onClose={closePlaintext} title="Revealed code">
        <p className="text-sm text-[var(--clicks-muted)]">Copy this value now. It will clear when you close.</p>
        <p className="mt-4 break-all rounded-lg bg-[var(--clicks-bg)] px-4 py-3 font-mono text-sm text-[var(--clicks-navy)]">
          {plaintext}
        </p>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={closePlaintext}
            className="h-9 rounded-lg bg-[var(--clicks-blue)] px-4 text-sm font-semibold text-white"
          >
            Close
          </button>
        </div>
      </AdminModal>
    </div>
  );
}
