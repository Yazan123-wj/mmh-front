"use client";

import { AdminModal } from "@/components/admin/ui/admin-modal";
import { Badge } from "@/components/admin/ui/badge";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { DataTable } from "@/components/admin/ui/data-table";
import { EmptyState } from "@/components/admin/ui/empty-state";
import { ErrorState } from "@/components/admin/ui/error-state";
import { Filters } from "@/components/admin/ui/filters";
import { FormField, adminInputClass, adminTextareaClass } from "@/components/admin/ui/form-field";
import { PageHeader } from "@/components/admin/ui/page-header";
import { Pagination } from "@/components/admin/ui/pagination";
import { useAdminToast } from "@/components/admin/ui/toast";
import { useAdminResource } from "@/hooks/use-admin-resource";
import {
  asList,
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
  type AdminCategory,
} from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import { useState } from "react";
import { ADMIN_LIST_PAGE_SIZE } from "@/components/admin/admin-list-page";

const emptyForm = {
  name_en: "",
  name_ar: "",
  slug: "",
  status: "PUBLISHED",
  sort_order: "0",
  description_en: "",
};

export function CategoriesListClient() {
  const toast = useAdminToast();
  const { token, page, setPage, search, setSearch, items, count, loading, error, reload } =
    useAdminResource<AdminCategory>(async (tok, p, s) => {
      const data = await listCategories(tok, { page: p, page_size: ADMIN_LIST_PAGE_SIZE, search: s || undefined });
      return asList(data);
    });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [pending, setPending] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminCategory | null>(null);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(row: AdminCategory) {
    setEditing(row);
    setForm({
      name_en: row.name_en,
      name_ar: row.name_ar ?? "",
      slug: row.slug,
      status: row.status,
      sort_order: String(row.sort_order ?? 0),
      description_en: row.description_en ?? "",
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
        status: form.status,
        sort_order: Number(form.sort_order) || 0,
        description_en: form.description_en.trim(),
      };
      if (editing) {
        await updateCategory(token, editing.id, body);
        toast.push("Category updated", "success");
      } else {
        await createCategory(token, body);
        toast.push("Category created", "success");
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
      await deleteCategory(token, deleteTarget.id);
      toast.push("Category deleted", "success");
      setDeleteTarget(null);
      await reload();
    } catch (err) {
      toast.push(err instanceof ApiError ? err.message : "Delete failed", "error");
    } finally {
      setPending(false);
    }
  }

  async function archive(row: AdminCategory) {
    if (!token) return;
    try {
      await updateCategory(token, row.id, { status: "ARCHIVED" });
      toast.push("Category archived", "success");
      await reload();
    } catch (err) {
      toast.push(err instanceof ApiError ? err.message : "Archive failed", "error");
    }
  }

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Product categories."
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="h-9 rounded-lg bg-[var(--clicks-blue)] px-3 text-sm font-semibold text-white"
          >
            New category
          </button>
        }
      />
      <Filters search={search} onSearchChange={setSearch} searchPlaceholder="Search categories…" />
      <DataTable
        columns={[
          { key: "name", header: "Name", render: (r) => r.name_en },
          { key: "slug", header: "Slug", render: (r) => r.slug },
          {
            key: "products",
            header: "Products",
            className: "tabular-nums",
            render: (r) => r.products_count ?? "—",
          },
          { key: "status", header: "Status", render: (r) => <Badge status={r.status} /> },
          { key: "sort", header: "Sort", render: (r) => r.sort_order ?? 0 },
          {
            key: "actions",
            header: "",
            render: (r) => (
              <div className="flex justify-end gap-2">
                <button type="button" className="text-xs font-medium text-[var(--clicks-blue)]" onClick={() => openEdit(r)}>
                  Edit
                </button>
                {r.status !== "ARCHIVED" ? (
                  <button type="button" className="text-xs font-medium text-[var(--clicks-muted)]" onClick={() => void archive(r)}>
                    Archive
                  </button>
                ) : null}
                <button
                  type="button"
                  className="text-xs font-medium text-[var(--clicks-error)]"
                  onClick={() => setDeleteTarget(r)}
                >
                  Delete
                </button>
              </div>
            ),
          },
        ]}
        rows={items}
        loading={loading}
        rowKey={(r) => String(r.id)}
        empty={<EmptyState title="No categories" />}
        error={error ? <ErrorState message={error} onRetry={reload} /> : null}
      />
      <Pagination page={page} pageSize={ADMIN_LIST_PAGE_SIZE} total={count} onPageChange={setPage} />

      <AdminModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit category" : "New category"}
      >
        <div className="space-y-3">
          <FormField label="Name (EN)" htmlFor="cat-name-en" required>
            <input
              id="cat-name-en"
              className={adminInputClass}
              value={form.name_en}
              onChange={(e) => setForm((f) => ({ ...f, name_en: e.target.value }))}
            />
          </FormField>
          <FormField label="Name (AR)" htmlFor="cat-name-ar">
            <input
              id="cat-name-ar"
              className={adminInputClass}
              dir="rtl"
              value={form.name_ar}
              onChange={(e) => setForm((f) => ({ ...f, name_ar: e.target.value }))}
            />
          </FormField>
          <FormField label="Slug" htmlFor="cat-slug" required>
            <input
              id="cat-slug"
              className={adminInputClass}
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Status" htmlFor="cat-status">
              <select
                id="cat-status"
                className={adminInputClass}
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </FormField>
            <FormField label="Sort order" htmlFor="cat-sort">
              <input
                id="cat-sort"
                type="number"
                className={adminInputClass}
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
              />
            </FormField>
          </div>
          <FormField label="Description (EN)" htmlFor="cat-desc">
            <textarea
              id="cat-desc"
              className={adminTextareaClass}
              value={form.description_en}
              onChange={(e) => setForm((f) => ({ ...f, description_en: e.target.value }))}
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="h-9 rounded-lg border border-[var(--clicks-border)] px-4 text-sm" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              disabled={pending || !form.name_en.trim() || !form.slug.trim()}
              onClick={() => void save()}
              className="h-9 rounded-lg bg-[var(--clicks-blue)] px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </AdminModal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete category?"
        description={deleteTarget ? `Permanently delete “${deleteTarget.name_en}”. This cannot be undone.` : undefined}
        danger
        pending={pending}
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
