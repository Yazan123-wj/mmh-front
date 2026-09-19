"use client";

import { ADMIN_LIST_PAGE_SIZE } from "@/components/admin/admin-list-page";
import { AdminModal } from "@/components/admin/ui/admin-modal";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { DataTable } from "@/components/admin/ui/data-table";
import { EmptyState } from "@/components/admin/ui/empty-state";
import { ErrorState } from "@/components/admin/ui/error-state";
import { Filters } from "@/components/admin/ui/filters";
import { FormField, adminInputClass } from "@/components/admin/ui/form-field";
import { PageHeader } from "@/components/admin/ui/page-header";
import { Pagination } from "@/components/admin/ui/pagination";
import { useAdminToast } from "@/components/admin/ui/toast";
import { useAdminResource } from "@/hooks/use-admin-resource";
import {
  asList,
  createRegion,
  deleteRegion,
  listRegions,
  updateRegion,
  type AdminRegion,
} from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import { useState } from "react";

const emptyForm = { name_en: "", name_ar: "", slug: "", currency: "JOD", locked: true };

export function RegionsListClient() {
  const toast = useAdminToast();
  const { token, page, setPage, search, setSearch, items, count, loading, error, reload } =
    useAdminResource<AdminRegion>(async (tok, p, s) => {
      const data = await listRegions(tok, { page: p, page_size: ADMIN_LIST_PAGE_SIZE, search: s || undefined });
      return asList(data);
    });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminRegion | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [pending, setPending] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminRegion | null>(null);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(row: AdminRegion) {
    setEditing(row);
    setForm({
      name_en: row.name_en,
      name_ar: row.name_ar ?? "",
      slug: row.slug,
      currency: row.currency,
      locked: Boolean(row.locked),
    });
    setModalOpen(true);
  }

  async function save() {
    if (!token) return;
    setPending(true);
    try {
      const body = {
        name_en: form.name_en.trim(),
        name_ar: form.name_ar.trim(),
        slug: form.slug.trim(),
        currency: form.currency.trim().toUpperCase(),
        locked: form.locked,
      };
      if (editing) {
        await updateRegion(token, editing.id, body);
        toast.push("Region updated", "success");
      } else {
        await createRegion(token, body);
        toast.push("Region created", "success");
      }
      setModalOpen(false);
      await reload();
    } catch (err) {
      toast.push(err instanceof ApiError ? err.message : "Save failed", "error");
    } finally {
      setPending(false);
    }
  }

  async function confirmDelete() {
    if (!token || !deleteTarget) return;
    setPending(true);
    try {
      await deleteRegion(token, deleteTarget.id);
      toast.push("Region deleted", "success");
      setDeleteTarget(null);
      await reload();
    } catch (err) {
      toast.push(err instanceof ApiError ? err.message : "Delete failed", "error");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Regions"
        description="Catalog regions and currencies."
        actions={
          <button type="button" onClick={openCreate} className="h-9 rounded-lg bg-[var(--clicks-blue)] px-3 text-sm font-semibold text-white">
            New region
          </button>
        }
      />
      <Filters search={search} onSearchChange={setSearch} searchPlaceholder="Search regions…" />
      <DataTable
        columns={[
          { key: "name", header: "Name", render: (r) => r.name_en },
          { key: "slug", header: "Slug", render: (r) => r.slug },
          { key: "currency", header: "Currency", render: (r) => r.currency },
          { key: "locked", header: "Locked", render: (r) => (r.locked ? "Yes" : "No") },
          {
            key: "actions",
            header: "",
            render: (r) => (
              <div className="flex justify-end gap-2">
                <button type="button" className="text-xs font-medium text-[var(--clicks-blue)]" onClick={() => openEdit(r)}>
                  Edit
                </button>
                <button type="button" className="text-xs font-medium text-[var(--clicks-error)]" onClick={() => setDeleteTarget(r)}>
                  Delete
                </button>
              </div>
            ),
          },
        ]}
        rows={items}
        loading={loading}
        rowKey={(r) => String(r.id)}
        empty={<EmptyState title="No regions" />}
        error={error ? <ErrorState message={error} onRetry={reload} /> : null}
      />
      <Pagination page={page} pageSize={ADMIN_LIST_PAGE_SIZE} total={count} onPageChange={setPage} />

      <AdminModal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit region" : "New region"}>
        <div className="space-y-3">
          <FormField label="Name (EN)" htmlFor="rg-name" required>
            <input id="rg-name" className={adminInputClass} value={form.name_en} onChange={(e) => setForm((f) => ({ ...f, name_en: e.target.value }))} />
          </FormField>
          <FormField label="Name (AR)" htmlFor="rg-name-ar">
            <input id="rg-name-ar" className={adminInputClass} dir="rtl" value={form.name_ar} onChange={(e) => setForm((f) => ({ ...f, name_ar: e.target.value }))} />
          </FormField>
          <FormField label="Slug" htmlFor="rg-slug" required>
            <input id="rg-slug" className={adminInputClass} value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
          </FormField>
          <FormField label="Currency" htmlFor="rg-currency" required>
            <input id="rg-currency" className={adminInputClass} value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} />
          </FormField>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.locked} onChange={(e) => setForm((f) => ({ ...f, locked: e.target.checked }))} />
            Locked region
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="h-9 rounded-lg border border-[var(--clicks-border)] px-4 text-sm" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="button" disabled={pending || !form.name_en.trim() || !form.slug.trim()} onClick={() => void save()} className="h-9 rounded-lg bg-[var(--clicks-blue)] px-4 text-sm font-semibold text-white disabled:opacity-60">
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </AdminModal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete region?"
        description={deleteTarget ? `Permanently delete “${deleteTarget.name_en}”.` : undefined}
        danger
        pending={pending}
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
