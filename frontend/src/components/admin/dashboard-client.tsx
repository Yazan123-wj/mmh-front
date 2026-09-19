"use client";

import { Badge } from "@/components/admin/ui/badge";
import { AdminCard, AdminSectionHeader } from "@/components/admin/ui/card";
import { ErrorState } from "@/components/admin/ui/error-state";
import { PageHeader } from "@/components/admin/ui/page-header";
import { StatCard } from "@/components/admin/ui/stat-card";
import { formatAdminDateTime } from "@/lib/admin/format";
import { getDashboardStats } from "@/lib/api/admin";
import { useAdminQuery } from "@/hooks/use-admin-query";
import { formatFils } from "@/server/money";
import {
  AlertTriangle,
  Boxes,
  Package,
  ShoppingCart,
  Users,
} from "lucide-react";
import Link from "next/link";

export function DashboardClient() {
  const { data: stats, loading, error, reload } = useAdminQuery((token) => getDashboardStats(token));

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Live snapshot of catalog, orders, inventory, and recent activity."
        actions={
          <Link href="/admin/products/new" className="admin-btn admin-btn-primary">
            New product
          </Link>
        }
      />

      {error ? <ErrorState message={error} onRetry={reload} /> : null}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="admin-card h-[88px] animate-pulse" />
          ))}
        </div>
      ) : null}

      {!loading && !error && stats ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Products"
              value={stats.products_count}
              hint={`${stats.active_products} published`}
              icon={Package}
            />
            <StatCard
              label="Orders"
              value={stats.orders_count}
              hint={`${stats.pending_orders} pending`}
              icon={ShoppingCart}
            />
            <StatCard label="Customers" value={stats.customers_count} icon={Users} />
            <StatCard
              label="Revenue"
              value={`${formatFils(stats.revenue_fils)} JOD`}
              hint={`${stats.codes_available} codes available`}
              icon={Boxes}
            />
          </div>

          {(stats.low_stock_variants > 0 || stats.failed_fulfillment > 0) && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {stats.low_stock_variants > 0 ? (
                <Link
                  href="/admin/inventory"
                  className="admin-card flex items-center gap-3 p-3 transition hover:border-[var(--clicks-border-strong)]"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-[var(--admin-radius-sm)] bg-amber-50 text-amber-700">
                    <AlertTriangle className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--clicks-navy)]">
                      {stats.low_stock_variants} low-stock variant{stats.low_stock_variants === 1 ? "" : "s"}
                    </p>
                    <p className="text-[11px] text-[var(--clicks-muted)]">Review inventory and import codes</p>
                  </div>
                </Link>
              ) : null}
              {stats.failed_fulfillment > 0 ? (
                <Link
                  href="/admin/orders"
                  className="admin-card flex items-center gap-3 p-3 transition hover:border-[var(--clicks-border-strong)]"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-[var(--admin-radius-sm)] bg-red-50 text-red-700">
                    <AlertTriangle className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--clicks-navy)]">
                      {stats.failed_fulfillment} fulfillment issue{stats.failed_fulfillment === 1 ? "" : "s"}
                    </p>
                    <p className="text-[11px] text-[var(--clicks-muted)]">Open orders needing attention</p>
                  </div>
                </Link>
              ) : null}
            </div>
          )}

          <div className="mt-4 grid gap-3 lg:grid-cols-5">
            <AdminCard className="lg:col-span-3" padding="md">
              <AdminSectionHeader
                title="Recent orders"
                action={
                  <Link href="/admin/orders" className="text-[12px] font-medium text-[var(--clicks-blue)]">
                    View all
                  </Link>
                }
              />
              {stats.recent_orders?.length ? (
                <div className="-mx-4 overflow-x-auto">
                  <table className="min-w-full text-[13px]">
                    <thead>
                      <tr className="border-y border-[var(--clicks-border)] bg-[#F7F8FC] text-[11px] text-[var(--clicks-muted)]">
                        <th className="px-4 py-2 text-start font-semibold">Order</th>
                        <th className="px-4 py-2 text-start font-semibold">Customer</th>
                        <th className="px-4 py-2 text-start font-semibold">Total</th>
                        <th className="px-4 py-2 text-start font-semibold">Payment</th>
                        <th className="px-4 py-2 text-start font-semibold">When</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recent_orders.slice(0, 8).map((order) => (
                        <tr key={String(order.id)} className="border-t border-[var(--clicks-border)] hover:bg-[#F8FAFD]">
                          <td className="px-4 py-2.5">
                            <Link
                              href={`/admin/orders/${order.id}`}
                              className="font-semibold text-[var(--clicks-blue)]"
                            >
                              {order.order_number}
                            </Link>
                          </td>
                          <td className="px-4 py-2.5">
                            <p className="font-medium text-[var(--clicks-navy)]">{order.full_name}</p>
                            <p className="text-[11px] text-[var(--clicks-muted)]">{order.email}</p>
                          </td>
                          <td className="px-4 py-2.5 tabular-nums">{formatFils(order.total_fils)} JOD</td>
                          <td className="px-4 py-2.5">
                            <Badge status={order.payment_status} />
                          </td>
                          <td className="px-4 py-2.5 text-[11px] text-[var(--clicks-muted)]">
                            {formatAdminDateTime(order.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="py-6 text-center text-[13px] text-[var(--clicks-muted)]">No recent orders.</p>
              )}
            </AdminCard>

            <AdminCard className="lg:col-span-2" padding="md">
              <AdminSectionHeader
                title="Top products"
                action={
                  <Link href="/admin/products" className="text-[12px] font-medium text-[var(--clicks-blue)]">
                    Catalog
                  </Link>
                }
              />
              {stats.top_products?.length ? (
                <ul className="divide-y divide-[var(--clicks-border)]">
                  {stats.top_products.slice(0, 7).map((p, idx) => (
                    <li key={String(p.product_id)} className="flex items-center gap-3 py-2.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F3F5F9] text-[10px] font-semibold text-[var(--clicks-muted)]">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-[var(--clicks-navy)]">{p.product_name}</p>
                        <p className="text-[11px] text-[var(--clicks-muted)]">
                          {p.quantity} sold · {p.orders} orders
                        </p>
                      </div>
                      <p className="shrink-0 text-[13px] font-semibold tabular-nums text-[var(--clicks-navy)]">
                        {formatFils(p.revenue_fils)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-6 text-center text-[13px] text-[var(--clicks-muted)]">No sales data yet.</p>
              )}
            </AdminCard>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            <AdminCard className="lg:col-span-2" padding="md">
              <AdminSectionHeader
                title="Recent audit"
                action={
                  <Link href="/admin/audit" className="text-[12px] font-medium text-[var(--clicks-blue)]">
                    View all
                  </Link>
                }
              />
              {stats.recent_audit?.length ? (
                <ul className="divide-y divide-[var(--clicks-border)]">
                  {stats.recent_audit.slice(0, 6).map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-3 py-2 text-[13px]">
                      <span className="font-medium text-[var(--clicks-navy)]">{a.action}</span>
                      <span className="shrink-0 text-[11px] text-[var(--clicks-muted)]">
                        {formatAdminDateTime(a.created_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-4 text-[13px] text-[var(--clicks-muted)]">No audit events yet.</p>
              )}
            </AdminCard>

            <AdminCard padding="md">
              <AdminSectionHeader title="Quick links" />
              <div className="grid gap-1.5">
                {[
                  { href: "/admin/orders", title: "Orders", body: "Payments & fulfillment" },
                  { href: "/admin/products", title: "Catalog", body: "Products & variants" },
                  { href: "/admin/codes/import", title: "Import codes", body: "Bulk CSV / XLSX" },
                  { href: "/admin/integrations/1epin", title: "OneEpin", body: "Supplier status" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-[var(--admin-radius-sm)] px-2.5 py-2 transition hover:bg-[#F5F7FB]"
                  >
                    <p className="text-[13px] font-semibold text-[var(--clicks-navy)]">{item.title}</p>
                    <p className="text-[11px] text-[var(--clicks-muted)]">{item.body}</p>
                  </Link>
                ))}
              </div>
            </AdminCard>
          </div>
        </>
      ) : null}
    </div>
  );
}
