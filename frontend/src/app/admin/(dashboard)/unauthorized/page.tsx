import Link from "next/link";

export default function AdminUnauthorizedPage() {
  return (
    <div className="mx-auto max-w-lg rounded-xl border border-[var(--clicks-border)] bg-white p-8 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--clicks-muted)]">403</p>
      <h1 className="mt-2 text-xl font-semibold text-[var(--clicks-navy)]">Access denied</h1>
      <p className="mt-2 text-sm text-[var(--clicks-muted)]">
        Your administrator role does not have permission to view this page. Backend APIs also enforce this rule.
      </p>
      <Link
        href="/admin"
        className="mt-6 inline-flex h-10 items-center rounded-lg bg-[var(--clicks-blue)] px-4 text-sm font-semibold text-white"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
