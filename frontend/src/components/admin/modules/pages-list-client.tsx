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
import { formatAdminDateTime } from "@/lib/admin/format";
import { useAdminResource } from "@/hooks/use-admin-resource";
import { asList, createPage, listPages, updatePage, type ContentPage } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import { useState } from "react";

const emptyForm = {
  slug: "",
  title_en: "",
  title_ar: "",
  body_en: "",
  body_ar: "",
  published: true,
};

export function PagesListClient() {
  const toast = useAdminToast();
  const { token, page, setPage, search, setSearch, items, count, loading, error, reload } =
    useAdminResource<ContentPage>(async (tok, p, s) => {
      const data = await listPages(tok, { page: p, page_size: ADMIN_LIST_PAGE_SIZE, search: s || undefined });
      return asList(data);
    });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ContentPage | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [pending, setPending] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(row: ContentPage) {
    setEditing(row);
    setForm({
      slug: row.slug,
      title_en: row.title_en,
      title_ar: row.title_ar ?? "",
      body_en: row.body_en ?? "",
      body_ar: row.body_ar ?? "",
      published: row.published,
    });
    setModalOpen(true);
  }

  async function save() {
    if (!token) return;
    setPending(true);
    try {
      const body: Partial<ContentPage> = {
        slug: form.slug.trim(),
        title_en: form.title_en.trim(),
        title_ar: form.title_ar.trim(),
        body_en: form.body_en.trim(),
        body_ar: form.body_ar.trim(),
        published: form.published,
      };
      if (editing) {
        await updatePage(token, editing.slug, body);
        toast.push("Page updated", "success");
      } else {
        await createPage(token, body);
        toast.push("Page created", "success");
      }
      setModalOpen(false);
      await reload();
    } catch (err) {
      toast.push(err instanceof ApiError ? err.message : "Save failed", "error");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Pages"
        description="CMS content pages."
        actions={
          <button type="button" onClick={openCreate} className="h-9 rounded-lg bg-[var(--clicks-blue)] px-3 text-sm font-semibold text-white">
            New page
          </button>
        }
      />
      <Filters search={search} onSearchChange={setSearch} searchPlaceholder="Search pages…" />
      <DataTable
        columns={[
          { key: "title", header: "Title", render: (r) => r.title_en },
          { key: "slug", header: "Slug", render: (r) => r.slug },
          {
            key: "published",
            header: "Published",
            render: (r) => <Badge status={r.published ? "PUBLISHED" : "DRAFT"} />,
          },
          { key: "updated", header: "Updated", render: (r) => formatAdminDateTime(r.updated_at) },
          {
            key: "actions",
            header: "",
            render: (r) => (
              <button type="button" className="text-xs font-medium text-[var(--clicks-blue)]" onClick={() => openEdit(r)}>
                Edit
              </button>
            ),
          },
        ]}
        rows={items}
        loading={loading}
        rowKey={(r) => String(r.id ?? r.slug)}
        empty={<EmptyState title="No pages" />}
        error={error ? <ErrorState message={error} onRetry={reload} /> : null}
      />
      <Pagination page={page} pageSize={ADMIN_LIST_PAGE_SIZE} total={count} onPageChange={setPage} />

      <AdminModal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit page" : "New page"} wide>
        <div className="space-y-3">
          <FormField label="Slug" htmlFor="pg-slug" required>
            <input
              id="pg-slug"
              className={adminInputClass}
              value={form.slug}
              disabled={Boolean(editing)}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            />
          </FormField>
          <FormField label="Title (EN)" htmlFor="pg-title" required>
            <input id="pg-title" className={adminInputClass} value={form.title_en} onChange={(e) => setForm((f) => ({ ...f, title_en: e.target.value }))} />
          </FormField>
          <FormField label="Title (AR)" htmlFor="pg-title-ar">
            <input id="pg-title-ar" className={adminInputClass} dir="rtl" value={form.title_ar} onChange={(e) => setForm((f) => ({ ...f, title_ar: e.target.value }))} />
          </FormField>
          <FormField label="Body (EN)" htmlFor="pg-body" required>
            <textarea id="pg-body" className={adminTextareaClass} value={form.body_en} onChange={(e) => setForm((f) => ({ ...f, body_en: e.target.value }))} />
          </FormField>
          <FormField label="Body (AR)" htmlFor="pg-body-ar">
            <textarea id="pg-body-ar" className={adminTextareaClass} dir="rtl" value={form.body_ar} onChange={(e) => setForm((f) => ({ ...f, body_ar: e.target.value }))} />
          </FormField>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.published} onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))} />
            Published
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="h-9 rounded-lg border border-[var(--clicks-border)] px-4 text-sm" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              disabled={pending || !form.slug.trim() || !form.title_en.trim() || !form.body_en.trim()}
              onClick={() => void save()}
              className="h-9 rounded-lg bg-[var(--clicks-blue)] px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
