"use client";

import { ADMIN_LIST_PAGE_SIZE } from "@/components/admin/admin-list-page";
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
import { asList, createFaq, deleteFaq, listFaqs, updateFaq, type FAQ } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import { useState } from "react";

const emptyForm = {
  question_en: "",
  question_ar: "",
  answer_en: "",
  answer_ar: "",
  published: true,
  sort_order: "0",
};

export function FaqsListClient() {
  const toast = useAdminToast();
  const { token, page, setPage, search, setSearch, items, count, loading, error, reload } =
    useAdminResource<FAQ>(async (tok, p, s) => {
      const data = await listFaqs(tok, { page: p, page_size: ADMIN_LIST_PAGE_SIZE, search: s || undefined });
      return asList(data);
    });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FAQ | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [pending, setPending] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FAQ | null>(null);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(row: FAQ) {
    setEditing(row);
    setForm({
      question_en: row.question_en,
      question_ar: row.question_ar ?? "",
      answer_en: row.answer_en,
      answer_ar: row.answer_ar ?? "",
      published: row.published,
      sort_order: String(row.sort_order ?? 0),
    });
    setModalOpen(true);
  }

  async function save() {
    if (!token) return;
    setPending(true);
    try {
      const body: Partial<FAQ> = {
        question_en: form.question_en.trim(),
        question_ar: form.question_ar.trim(),
        answer_en: form.answer_en.trim(),
        answer_ar: form.answer_ar.trim(),
        published: form.published,
        sort_order: Number(form.sort_order) || 0,
      };
      if (editing) {
        await updateFaq(token, editing.id, body);
        toast.push("FAQ updated", "success");
      } else {
        await createFaq(token, body);
        toast.push("FAQ created", "success");
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
      await deleteFaq(token, deleteTarget.id);
      toast.push("FAQ deleted", "success");
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
        title="FAQs"
        description="Help center questions."
        actions={
          <button type="button" onClick={openCreate} className="h-9 rounded-lg bg-[var(--clicks-blue)] px-3 text-sm font-semibold text-white">
            New FAQ
          </button>
        }
      />
      <Filters search={search} onSearchChange={setSearch} searchPlaceholder="Search FAQs…" />
      <DataTable
        columns={[
          { key: "q", header: "Question", render: (r) => r.question_en },
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
        empty={<EmptyState title="No FAQs" />}
        error={error ? <ErrorState message={error} onRetry={reload} /> : null}
      />
      <Pagination page={page} pageSize={ADMIN_LIST_PAGE_SIZE} total={count} onPageChange={setPage} />

      <AdminModal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit FAQ" : "New FAQ"} wide>
        <div className="space-y-3">
          <FormField label="Question (EN)" htmlFor="faq-q" required>
            <input id="faq-q" className={adminInputClass} value={form.question_en} onChange={(e) => setForm((f) => ({ ...f, question_en: e.target.value }))} />
          </FormField>
          <FormField label="Question (AR)" htmlFor="faq-q-ar">
            <input id="faq-q-ar" className={adminInputClass} dir="rtl" value={form.question_ar} onChange={(e) => setForm((f) => ({ ...f, question_ar: e.target.value }))} />
          </FormField>
          <FormField label="Answer (EN)" htmlFor="faq-a" required>
            <textarea id="faq-a" className={adminTextareaClass} value={form.answer_en} onChange={(e) => setForm((f) => ({ ...f, answer_en: e.target.value }))} />
          </FormField>
          <FormField label="Answer (AR)" htmlFor="faq-a-ar">
            <textarea id="faq-a-ar" className={adminTextareaClass} dir="rtl" value={form.answer_ar} onChange={(e) => setForm((f) => ({ ...f, answer_ar: e.target.value }))} />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Sort order" htmlFor="faq-sort">
              <input id="faq-sort" type="number" className={adminInputClass} value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))} />
            </FormField>
            <label className="flex items-end gap-2 pb-2 text-sm">
              <input type="checkbox" checked={form.published} onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))} />
              Published
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="h-9 rounded-lg border border-[var(--clicks-border)] px-4 text-sm" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="button" disabled={pending || !form.question_en.trim() || !form.answer_en.trim()} onClick={() => void save()} className="h-9 rounded-lg bg-[var(--clicks-blue)] px-4 text-sm font-semibold text-white disabled:opacity-60">
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </AdminModal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete FAQ?"
        description={deleteTarget ? `Permanently delete “${deleteTarget.question_en}”.` : undefined}
        danger
        pending={pending}
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
