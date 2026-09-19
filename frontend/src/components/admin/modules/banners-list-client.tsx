"use client";

import { ADMIN_LIST_PAGE_SIZE } from "@/components/admin/admin-list-page";
import { AdminModal } from "@/components/admin/ui/admin-modal";
import { Badge } from "@/components/admin/ui/badge";
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
  createBanner,
  deleteBanner,
  listBanners,
  updateBanner,
  type Banner,
} from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import { useState } from "react";

const emptyForm = {
  title_en: "",
  title_ar: "",
  subtitle_en: "",
  subtitle_ar: "",
  href: "/",
  placement: "HOME",
  desktop_image: "",
  mobile_image: "",
  published: false,
  sort_order: "0",
};

export function BannersListClient() {
  const toast = useAdminToast();
  const { token, page, setPage, search, setSearch, items, count, loading, error, reload } =
    useAdminResource<Banner>(async (tok, p, s) => {
      const data = await listBanners(tok, { page: p, page_size: ADMIN_LIST_PAGE_SIZE, search: s || undefined });
      return asList(data);
    });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [pending, setPending] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(row: Banner) {
    setEditing(row);
    setForm({
      title_en: row.title_en,
      title_ar: row.title_ar ?? "",
      subtitle_en: row.subtitle_en ?? "",
      subtitle_ar: row.subtitle_ar ?? "",
      href: row.href,
      placement: row.placement ?? "HOME",
      desktop_image: row.desktop_image ?? "",
      mobile_image: row.mobile_image ?? "",
      published: row.published,
      sort_order: String(row.sort_order ?? 0),
    });
    setModalOpen(true);
  }

  async function save() {
    if (!token) return;
    setPending(true);
    try {
      const body: Partial<Banner> = {
        title_en: form.title_en.trim(),
        title_ar: form.title_ar.trim(),
        subtitle_en: form.subtitle_en.trim(),
        subtitle_ar: form.subtitle_ar.trim(),
        href: form.href.trim(),
        placement: form.placement,
        desktop_image: form.desktop_image.trim(),
        mobile_image: form.mobile_image.trim(),
        published: form.published,
        sort_order: Number(form.sort_order) || 0,
      };
      if (editing) {
        await updateBanner(token, editing.id, body);
        toast.push("Banner updated", "success");
      } else {
        await createBanner(token, body);
        toast.push("Banner created", "success");
      }
      setModalOpen(false);
      await reload();
    } catch (err) {
      toast.push(err instanceof ApiError ? err.message : "Save failed", "error");
    } finally {
      setPending(false);
    }
  }

  async function togglePublish(row: Banner) {
    if (!token) return;
    try {
      await updateBanner(token, row.id, { published: !row.published });
      toast.push(row.published ? "Banner unpublished" : "Banner published", "success");
      await reload();
    } catch (err) {
      toast.push(err instanceof ApiError ? err.message : "Update failed", "error");
    }
  }

  async function confirmDelete() {
    if (!token || !deleteTarget) return;
    setPending(true);
    try {
      await deleteBanner(token, deleteTarget.id);
      toast.push("Banner deleted", "success");
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
        title="Banners"
        description="Storefront promotional banners."
        actions={
          <button type="button" onClick={openCreate} className="h-9 rounded-lg bg-[var(--clicks-blue)] px-3 text-sm font-semibold text-white">
            New banner
          </button>
        }
      />
      <Filters search={search} onSearchChange={setSearch} searchPlaceholder="Search banners…" />
      <DataTable
        columns={[
          { key: "title", header: "Title", render: (r) => r.title_en },
          { key: "placement", header: "Placement", render: (r) => r.placement || "—" },
          { key: "href", header: "Link", render: (r) => r.href || "—" },
          {
            key: "published",
            header: "Published",
            render: (r) => <Badge status={r.published ? "PUBLISHED" : "DRAFT"} />,
          },
          { key: "sort", header: "Sort", render: (r) => r.sort_order ?? 0 },
          {
            key: "actions",
            header: "",
            render: (r) => (
              <div className="flex justify-end gap-2">
                <button type="button" className="text-xs font-medium text-[var(--clicks-blue)]" onClick={() => openEdit(r)}>
                  Edit
                </button>
                <button type="button" className="text-xs font-medium text-[var(--clicks-muted)]" onClick={() => void togglePublish(r)}>
                  {r.published ? "Unpublish" : "Publish"}
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
        empty={<EmptyState title="No banners" />}
        error={error ? <ErrorState message={error} onRetry={reload} /> : null}
      />
      <Pagination page={page} pageSize={ADMIN_LIST_PAGE_SIZE} total={count} onPageChange={setPage} />

      <AdminModal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit banner" : "New banner"} wide>
        <div className="space-y-3">
          <FormField label="Title (EN)" htmlFor="bn-title" required>
            <input id="bn-title" className={adminInputClass} value={form.title_en} onChange={(e) => setForm((f) => ({ ...f, title_en: e.target.value }))} />
          </FormField>
          <FormField label="Title (AR)" htmlFor="bn-title-ar">
            <input id="bn-title-ar" className={adminInputClass} dir="rtl" value={form.title_ar} onChange={(e) => setForm((f) => ({ ...f, title_ar: e.target.value }))} />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Subtitle (EN)" htmlFor="bn-sub">
              <input id="bn-sub" className={adminInputClass} value={form.subtitle_en} onChange={(e) => setForm((f) => ({ ...f, subtitle_en: e.target.value }))} />
            </FormField>
            <FormField label="Subtitle (AR)" htmlFor="bn-sub-ar">
              <input id="bn-sub-ar" className={adminInputClass} dir="rtl" value={form.subtitle_ar} onChange={(e) => setForm((f) => ({ ...f, subtitle_ar: e.target.value }))} />
            </FormField>
          </div>
          <FormField label="Href" htmlFor="bn-href" required>
            <input id="bn-href" className={adminInputClass} value={form.href} onChange={(e) => setForm((f) => ({ ...f, href: e.target.value }))} />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Placement" htmlFor="bn-place">
              <select id="bn-place" className={adminInputClass} value={form.placement} onChange={(e) => setForm((f) => ({ ...f, placement: e.target.value }))}>
                <option value="HOME">Home</option>
                <option value="SHOP">Shop</option>
                <option value="CATEGORY">Category</option>
                <option value="PROMO">Promo</option>
              </select>
            </FormField>
            <FormField label="Sort order" htmlFor="bn-sort">
              <input id="bn-sort" type="number" className={adminInputClass} value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))} />
            </FormField>
          </div>
          <FormField label="Desktop image URL" htmlFor="bn-desk">
            <input id="bn-desk" className={adminInputClass} value={form.desktop_image} onChange={(e) => setForm((f) => ({ ...f, desktop_image: e.target.value }))} />
          </FormField>
          <FormField label="Mobile image URL" htmlFor="bn-mob">
            <input id="bn-mob" className={adminInputClass} value={form.mobile_image} onChange={(e) => setForm((f) => ({ ...f, mobile_image: e.target.value }))} />
          </FormField>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.published} onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))} />
            Published
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="h-9 rounded-lg border border-[var(--clicks-border)] px-4 text-sm" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="button" disabled={pending || !form.title_en.trim()} onClick={() => void save()} className="h-9 rounded-lg bg-[var(--clicks-blue)] px-4 text-sm font-semibold text-white disabled:opacity-60">
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </AdminModal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete banner?"
        description={deleteTarget ? `Permanently delete “${deleteTarget.title_en}”.` : undefined}
        danger
        pending={pending}
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
