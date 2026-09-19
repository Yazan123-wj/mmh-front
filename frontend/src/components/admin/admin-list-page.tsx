"use client";

import { DataTable, type DataTableColumn } from "@/components/admin/ui/data-table";
import { EmptyState } from "@/components/admin/ui/empty-state";
import { ErrorState } from "@/components/admin/ui/error-state";
import { Filters } from "@/components/admin/ui/filters";
import { PageHeader } from "@/components/admin/ui/page-header";
import { Pagination } from "@/components/admin/ui/pagination";
import { useAdminResource } from "@/hooks/use-admin-resource";

const PAGE_SIZE = 24;

export function AdminListPage<T>({
  title,
  description,
  actions,
  columns,
  rowKey,
  searchPlaceholder,
  emptyTitle,
  emptyDescription,
  loader,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  columns: DataTableColumn<T>[];
  rowKey: (row: T) => string;
  searchPlaceholder?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  loader: (token: string, page: number, search: string) => Promise<{ items: T[]; count: number }>;
}) {
  const { page, setPage, search, setSearch, items, count, loading, error, reload } = useAdminResource<T>(loader);

  return (
    <div>
      <PageHeader title={title} description={description} actions={actions} />
      <Filters search={search} onSearchChange={setSearch} searchPlaceholder={searchPlaceholder} />
      <DataTable
        columns={columns}
        rows={items}
        loading={loading}
        rowKey={rowKey}
        empty={<EmptyState title={emptyTitle ?? `No ${title.toLowerCase()}`} description={emptyDescription} />}
        error={error ? <ErrorState message={error} onRetry={reload} /> : null}
      />
      <Pagination page={page} pageSize={PAGE_SIZE} total={count} onPageChange={setPage} />
    </div>
  );
}

export { PAGE_SIZE as ADMIN_LIST_PAGE_SIZE };
