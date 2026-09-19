"use client";

import { ADMIN_LIST_PAGE_SIZE } from "@/components/admin/admin-list-page";
import { AdminModal } from "@/components/admin/ui/admin-modal";
import { Badge } from "@/components/admin/ui/badge";
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
  createAdministrator,
  listAdministrators,
  updateAdministrator,
  type AdminUser,
} from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import { useState } from "react";

const ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "CATALOG_MANAGER",
  "ORDER_MANAGER",
  "CONTENT_MANAGER",
  "SUPPORT_AGENT",
  "VIEWER",
];

const emptyForm = {
  email: "",
  password: "",
  full_name: "",
  role: "VIEWER",
  title: "",
};

export function AdministratorsListClient() {
  const toast = useAdminToast();
  const { token, page, setPage, search, setSearch, items, count, loading, error, reload } =
    useAdminResource<AdminUser>(async (tok, p, s) => {
      const data = await listAdministrators(tok, {
        page: p,
        page_size: ADMIN_LIST_PAGE_SIZE,
        search: s || undefined,
      });
      return asList(data);
    });

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [pending, setPending] = useState(false);

  async function save() {
    if (!token) return;
    setPending(true);
    try {
      await createAdministrator(token, {
        email: form.email.trim(),
        password: form.password,
        full_name: form.full_name.trim(),
        role: form.role,
        title: form.title.trim() || undefined,
      });
      toast.push("Administrator created", "success");
      setModalOpen(false);
      setForm(emptyForm);
      await reload();
    } catch (err) {
      toast.push(err instanceof ApiError ? err.message : "Create failed", "error");
    } finally {
      setPending(false);
    }
  }

  async function toggleDisabled(row: AdminUser) {
    if (!token) return;
    try {
      await updateAdministrator(token, row.id, { disabled: !row.disabled });
      toast.push(row.disabled ? "Administrator enabled" : "Administrator disabled", "success");
      await reload();
    } catch (err) {
      toast.push(err instanceof ApiError ? err.message : "Update failed", "error");
    }
  }

  return (
    <div>
      <PageHeader
        title="Administrators"
        description="Admin users and roles."
        actions={
          <button
            type="button"
            onClick={() => {
              setForm(emptyForm);
              setModalOpen(true);
            }}
            className="h-9 rounded-lg bg-[var(--clicks-blue)] px-3 text-sm font-semibold text-white"
          >
            New admin
          </button>
        }
      />
      <Filters search={search} onSearchChange={setSearch} searchPlaceholder="Search admins…" />
      <DataTable
        columns={[
          {
            key: "name",
            header: "Admin",
            render: (r) => r.first_name || r.email,
          },
          { key: "email", header: "Email", render: (r) => r.email },
          { key: "role", header: "Role", render: (r) => r.role?.replaceAll("_", " ") || "—" },
          {
            key: "status",
            header: "Status",
            render: (r) => <Badge status={r.disabled ? "DISABLED" : "ACTIVE"} />,
          },
          {
            key: "actions",
            header: "",
            render: (r) => (
              <button
                type="button"
                className="text-xs font-medium text-[var(--clicks-muted)]"
                onClick={() => void toggleDisabled(r)}
              >
                {r.disabled ? "Enable" : "Disable"}
              </button>
            ),
          },
        ]}
        rows={items}
        loading={loading}
        rowKey={(r) => String(r.id)}
        empty={<EmptyState title="No administrators" />}
        error={error ? <ErrorState message={error} onRetry={reload} /> : null}
      />
      <Pagination page={page} pageSize={ADMIN_LIST_PAGE_SIZE} total={count} onPageChange={setPage} />

      <AdminModal open={modalOpen} onClose={() => setModalOpen(false)} title="New administrator">
        <div className="space-y-3">
          <FormField label="Full name" htmlFor="ad-name" required>
            <input
              id="ad-name"
              className={adminInputClass}
              value={form.full_name}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
            />
          </FormField>
          <FormField label="Email" htmlFor="ad-email" required>
            <input
              id="ad-email"
              type="email"
              className={adminInputClass}
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </FormField>
          <FormField label="Password" htmlFor="ad-pass" required hint="Minimum 12 characters">
            <input
              id="ad-pass"
              type="password"
              className={adminInputClass}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
          </FormField>
          <FormField label="Role" htmlFor="ad-role">
            <select
              id="ad-role"
              className={adminInputClass}
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Title" htmlFor="ad-title">
            <input
              id="ad-title"
              className={adminInputClass}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="h-9 rounded-lg border border-[var(--clicks-border)] px-4 text-sm"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={pending || !form.email.trim() || !form.full_name.trim() || form.password.length < 12}
              onClick={() => void save()}
              className="h-9 rounded-lg bg-[var(--clicks-blue)] px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              {pending ? "Creating…" : "Create"}
            </button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
