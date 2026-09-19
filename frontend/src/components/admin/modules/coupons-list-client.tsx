"use client";

import { ADMIN_LIST_PAGE_SIZE } from "@/components/admin/admin-list-page";
import { AdminModal } from "@/components/admin/ui/admin-modal";
import { Badge } from "@/components/admin/ui/badge";
import { DataTable } from "@/components/admin/ui/data-table";
import { EmptyState } from "@/components/admin/ui/empty-state";
import { ErrorState } from "@/components/admin/ui/error-state";
import { Filters } from "@/components/admin/ui/filters";
import { FormField, adminInputClass, adminTextareaClass } from "@/components/admin/ui/form-field";
import { PageHeader } from "@/components/admin/ui/page-header";
import { Pagination } from "@/components/admin/ui/pagination";
import { useAdminToast } from "@/components/admin/ui/toast";
import { useAdminResource } from "@/hooks/use-admin-resource";
import { createCoupon, listCoupons, updateCoupon, type Coupon } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import { formatFils } from "@/server/money";
import { useState } from "react";

const emptyForm = {
  code: "",
  description: "",
  percent_off: "",
  amount_off_fils: "",
  active: true,
  max_uses: "",
  starts_at: "",
  ends_at: "",
};

export function CouponsListClient() {
  const toast = useAdminToast();
  const { token, page, setPage, search, setSearch, items, count, loading, error, reload } =
    useAdminResource<Coupon>(async (tok, p, s) => {
      const data = await listCoupons(tok, { page: p, page_size: ADMIN_LIST_PAGE_SIZE, search: s || undefined });
      return { items: data.results, count: data.count };
    });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [pending, setPending] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(row: Coupon) {
    setEditing(row);
    setForm({
      code: row.code,
      description: row.description ?? "",
      percent_off: row.percent_off != null ? String(row.percent_off) : "",
      amount_off_fils: row.amount_off_fils != null ? String(row.amount_off_fils) : "",
      active: row.active,
      max_uses: row.max_uses != null ? String(row.max_uses) : "",
      starts_at: row.starts_at ? row.starts_at.slice(0, 16) : "",
      ends_at: row.ends_at ? row.ends_at.slice(0, 16) : "",
    });
    setModalOpen(true);
  }

  async function save() {
    if (!token) return;
    setPending(true);
    try {
      const body: Partial<Coupon> = {
        code: form.code.trim().toUpperCase(),
        description: form.description.trim(),
        active: form.active,
        percent_off: form.percent_off ? Number(form.percent_off) : null,
        amount_off_fils: form.amount_off_fils ? Number(form.amount_off_fils) : null,
        max_uses: form.max_uses ? Number(form.max_uses) : null,
        starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      };
      if (editing) {
        await updateCoupon(token, editing.id, body);
        toast.push("Coupon updated", "success");
      } else {
        await createCoupon(token, body);
        toast.push("Coupon created", "success");
      }
      setModalOpen(false);
      await reload();
    } catch (err) {
      toast.push(err instanceof ApiError ? err.message : "Save failed", "error");
    } finally {
      setPending(false);
    }
  }

  async function toggleActive(row: Coupon) {
    if (!token) return;
    try {
      await updateCoupon(token, row.id, { active: !row.active });
      toast.push(row.active ? "Coupon deactivated" : "Coupon activated", "success");
      await reload();
    } catch (err) {
      toast.push(err instanceof ApiError ? err.message : "Update failed", "error");
    }
  }

  function discountLabel(r: Coupon) {
    if (r.percent_off != null && r.percent_off !== "") return `${r.percent_off}%`;
    if (r.amount_off_fils != null) return `${formatFils(r.amount_off_fils)} JOD`;
    return "—";
  }

  return (
    <div>
      <PageHeader
        title="Coupons"
        description="Discount codes and promotions."
        actions={
          <button type="button" onClick={openCreate} className="h-9 rounded-lg bg-[var(--clicks-blue)] px-3 text-sm font-semibold text-white">
            New coupon
          </button>
        }
      />
      <Filters search={search} onSearchChange={setSearch} searchPlaceholder="Search coupons…" />
      <DataTable
        columns={[
          { key: "code", header: "Code", render: (r) => <span className="font-mono text-xs">{r.code}</span> },
          { key: "discount", header: "Discount", render: (r) => discountLabel(r) },
          {
            key: "status",
            header: "Status",
            render: (r) => <Badge status={r.active ? "ACTIVE" : "DISABLED"} />,
          },
          {
            key: "usage",
            header: "Usage",
            render: (r) => `${r.used_count ?? 0}${r.max_uses != null ? ` / ${r.max_uses}` : ""}`,
          },
          {
            key: "actions",
            header: "",
            render: (r) => (
              <div className="flex justify-end gap-2">
                <button type="button" className="text-xs font-medium text-[var(--clicks-blue)]" onClick={() => openEdit(r)}>
                  Edit
                </button>
                <button type="button" className="text-xs font-medium text-[var(--clicks-muted)]" onClick={() => void toggleActive(r)}>
                  {r.active ? "Deactivate" : "Activate"}
                </button>
              </div>
            ),
          },
        ]}
        rows={items}
        loading={loading}
        rowKey={(r) => String(r.id)}
        empty={<EmptyState title="No coupons" />}
        error={error ? <ErrorState message={error} onRetry={reload} /> : null}
      />
      <Pagination page={page} pageSize={ADMIN_LIST_PAGE_SIZE} total={count} onPageChange={setPage} />

      <AdminModal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit coupon" : "New coupon"}>
        <div className="space-y-3">
          <FormField label="Code" htmlFor="cp-code" required>
            <input id="cp-code" className={adminInputClass} value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
          </FormField>
          <FormField label="Description" htmlFor="cp-desc">
            <textarea id="cp-desc" className={adminTextareaClass} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Percent off" htmlFor="cp-pct" hint="e.g. 10 for 10%">
              <input id="cp-pct" type="number" step="0.01" className={adminInputClass} value={form.percent_off} onChange={(e) => setForm((f) => ({ ...f, percent_off: e.target.value }))} />
            </FormField>
            <FormField label="Amount off (fils)" htmlFor="cp-fils" hint="1000 = 1.000 JOD">
              <input id="cp-fils" type="number" className={adminInputClass} value={form.amount_off_fils} onChange={(e) => setForm((f) => ({ ...f, amount_off_fils: e.target.value }))} />
            </FormField>
          </div>
          <FormField label="Max uses" htmlFor="cp-max">
            <input id="cp-max" type="number" className={adminInputClass} value={form.max_uses} onChange={(e) => setForm((f) => ({ ...f, max_uses: e.target.value }))} />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Starts at" htmlFor="cp-start">
              <input id="cp-start" type="datetime-local" className={adminInputClass} value={form.starts_at} onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))} />
            </FormField>
            <FormField label="Ends at" htmlFor="cp-end">
              <input id="cp-end" type="datetime-local" className={adminInputClass} value={form.ends_at} onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))} />
            </FormField>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
            Active
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="h-9 rounded-lg border border-[var(--clicks-border)] px-4 text-sm" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="button" disabled={pending || !form.code.trim()} onClick={() => void save()} className="h-9 rounded-lg bg-[var(--clicks-blue)] px-4 text-sm font-semibold text-white disabled:opacity-60">
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
