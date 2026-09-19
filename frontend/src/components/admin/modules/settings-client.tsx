"use client";

import { ErrorState } from "@/components/admin/ui/error-state";
import { FormField, adminInputClass } from "@/components/admin/ui/form-field";
import { PageHeader } from "@/components/admin/ui/page-header";
import { useAdminToast } from "@/components/admin/ui/toast";
import { useAdminQuery } from "@/hooks/use-admin-query";
import { getSiteSettings, updateSiteSettings } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import { useState } from "react";

export function SettingsClient() {
  const toast = useAdminToast();
  const [pending, setPending] = useState(false);
  const { data: settings, setData: setSettings, loading, error, reload, token } = useAdminQuery((tok) =>
    getSiteSettings(tok),
  );

  return (
    <div>
      <PageHeader title="Settings" description="Site-wide configuration." />
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {loading ? <div className="h-48 animate-pulse rounded-xl border border-[var(--clicks-border)] bg-white" /> : null}
      {!loading && !error && settings ? (
        <form
          className="max-w-xl space-y-4 rounded-xl border border-[var(--clicks-border)] bg-white p-5"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!token) return;
            setPending(true);
            const fd = new FormData(e.currentTarget);
            try {
              const next = await updateSiteSettings(token, {
                store_name: String(fd.get("store_name") ?? ""),
                support_email: String(fd.get("support_email") ?? ""),
                support_phone: String(fd.get("support_phone") ?? ""),
                currency_display: String(fd.get("currency_display") ?? "JOD"),
                low_stock_threshold: Number(fd.get("low_stock_threshold") ?? 5),
                maintenance_mode: fd.get("maintenance_mode") === "on",
              });
              setSettings(next);
              toast.push("Settings saved", "success");
            } catch (err) {
              toast.push(err instanceof ApiError ? err.message : "Save failed", "error");
            } finally {
              setPending(false);
            }
          }}
        >
          <FormField label="Store name" htmlFor="store_name">
            <input
              id="store_name"
              name="store_name"
              className={adminInputClass}
              defaultValue={settings.store_name ?? "MMH"}
            />
          </FormField>
          <FormField label="Support email" htmlFor="support_email">
            <input
              id="support_email"
              name="support_email"
              type="email"
              className={adminInputClass}
              defaultValue={settings.support_email ?? ""}
            />
          </FormField>
          <FormField label="Support phone" htmlFor="support_phone">
            <input
              id="support_phone"
              name="support_phone"
              className={adminInputClass}
              defaultValue={settings.support_phone ?? ""}
            />
          </FormField>
          <FormField label="Currency display" htmlFor="currency_display">
            <input
              id="currency_display"
              name="currency_display"
              className={adminInputClass}
              defaultValue={settings.currency_display ?? "JOD"}
            />
          </FormField>
          <FormField label="Low stock threshold" htmlFor="low_stock_threshold">
            <input
              id="low_stock_threshold"
              name="low_stock_threshold"
              type="number"
              className={adminInputClass}
              defaultValue={settings.low_stock_threshold ?? 5}
            />
          </FormField>
          <label className="flex items-center gap-2 text-sm">
            <input name="maintenance_mode" type="checkbox" defaultChecked={Boolean(settings.maintenance_mode)} />
            Maintenance mode
          </label>
          <button
            type="submit"
            disabled={pending}
            className="h-10 rounded-lg bg-[var(--clicks-blue)] px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save settings"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
