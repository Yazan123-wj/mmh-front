"use client";

import { EmptyState } from "@/components/admin/ui/empty-state";
import { ErrorState } from "@/components/admin/ui/error-state";
import { PageHeader } from "@/components/admin/ui/page-header";
import { useAdminToast } from "@/components/admin/ui/toast";
import { useAdminQuery } from "@/hooks/use-admin-query";
import {
  listPermissions,
  listRoles,
  updateRolePermissions,
  type RoleInfo,
} from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import { useState } from "react";

export function RolesListClient() {
  const toast = useAdminToast();
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState(false);

  const { data, setData, loading, error, reload, token } = useAdminQuery(async (tok) => {
    const [roleList, permList] = await Promise.all([listRoles(tok), listPermissions(tok)]);
    return { roles: roleList, permissions: permList };
  });

  const roles = data?.roles ?? [];
  const permissions = data?.permissions ?? [];

  // Seed selection from first role once data arrives (render-time adjust, not an effect).
  if (data && !selected && data.roles.length) {
    setSelected(data.roles[0].role);
    setDraft(new Set(data.roles[0].permissions.filter((p) => p !== "*")));
  }

  function selectRole(role: RoleInfo) {
    setSelected(role.role);
    setDraft(new Set(role.permissions.filter((p) => p !== "*")));
  }

  function togglePerm(key: string) {
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function save() {
    if (!token || !selected) return;
    const role = roles.find((r) => r.role === selected);
    if (role?.permissions.includes("*")) {
      toast.push("SUPER_ADMIN permissions are fixed", "error");
      return;
    }
    setPending(true);
    try {
      await updateRolePermissions(token, selected, Array.from(draft).sort());
      toast.push("Permissions saved", "success");
      const roleList = await listRoles(token);
      setData((prev) => (prev ? { ...prev, roles: roleList } : { roles: roleList, permissions }));
      const current = roleList.find((r) => r.role === selected);
      if (current) setDraft(new Set(current.permissions.filter((p) => p !== "*")));
    } catch (err) {
      toast.push(err instanceof ApiError ? err.message : "Save failed", "error");
    } finally {
      setPending(false);
    }
  }

  const current = roles.find((r) => r.role === selected);
  const isSuper = Boolean(current?.permissions.includes("*"));

  return (
    <div>
      <PageHeader
        title="Roles"
        description="Admin role definitions and permission sets."
        actions={
          selected && !isSuper ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => void save()}
              className="h-9 rounded-lg bg-[var(--clicks-blue)] px-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save permissions"}
            </button>
          ) : null
        }
      />
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {loading ? <div className="h-40 animate-pulse rounded-xl border border-[var(--clicks-border)] bg-white" /> : null}
      {!loading && !error && !roles.length ? <EmptyState title="No roles returned" /> : null}
      {!loading && !error && roles.length ? (
        <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
          <div className="space-y-1 rounded-xl border border-[var(--clicks-border)] bg-white p-2">
            {roles.map((role) => (
              <button
                key={role.role}
                type="button"
                onClick={() => selectRole(role)}
                className={`block w-full rounded-lg px-3 py-2 text-start text-sm ${
                  selected === role.role
                    ? "bg-[var(--clicks-blue)]/10 font-semibold text-[var(--clicks-blue)]"
                    : "text-[var(--clicks-navy)] hover:bg-[var(--clicks-bg)]"
                }`}
              >
                {role.label || role.role}
              </button>
            ))}
          </div>
          <div className="rounded-xl border border-[var(--clicks-border)] bg-white p-4">
            <p className="font-semibold text-[var(--clicks-navy)]">{current?.label || selected}</p>
            <p className="mt-1 text-xs text-[var(--clicks-muted)]">{selected}</p>
            {isSuper ? (
              <p className="mt-4 text-sm text-[var(--clicks-muted)]">
                This role has full access (*) and cannot be edited via the matrix.
              </p>
            ) : (
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {permissions.map((perm) => (
                  <label key={perm.key} className="flex items-start gap-2 rounded-lg border border-[var(--clicks-border)] p-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={draft.has(perm.key)}
                      onChange={() => togglePerm(perm.key)}
                    />
                    <span>
                      <span className="font-medium text-[var(--clicks-navy)]">{perm.key}</span>
                      {perm.description ? (
                        <span className="mt-0.5 block text-xs text-[var(--clicks-muted)]">{perm.description}</span>
                      ) : null}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
