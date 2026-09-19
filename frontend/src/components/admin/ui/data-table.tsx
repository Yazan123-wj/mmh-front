import { cn } from "@/lib/cn";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  className?: string;
  headerClassName?: string;
  render: (row: T) => React.ReactNode;
};

export function DataTable<T>({
  columns,
  rows,
  loading,
  empty,
  error,
  rowKey,
  className,
  dense,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  loading?: boolean;
  empty?: React.ReactNode;
  error?: React.ReactNode;
  rowKey: (row: T) => string;
  className?: string;
  dense?: boolean;
}) {
  if (error) return <>{error}</>;
  if (loading) {
    return (
      <div className={cn("admin-card overflow-hidden", className)}>
        <div className="animate-pulse">
          <div className="h-9 bg-[#F3F5F9]" />
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex h-11 items-center border-t border-[var(--clicks-border)] px-3.5">
              <div className="h-3.5 w-2/5 rounded bg-[#E8ECF4]" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (!rows.length) return <>{empty}</>;

  return (
    <div className={cn("admin-card overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="min-w-full text-start text-[13px]">
          <thead className="border-b border-[var(--clicks-border)] bg-[#F7F8FC]">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-3.5 py-2.5 text-start text-[11px] font-semibold tracking-[0.02em] text-[var(--clicks-muted)]",
                    col.headerClassName,
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                className="border-t border-[var(--clicks-border)] transition-colors hover:bg-[#F8FAFD]"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      dense ? "px-3.5 py-2" : "px-3.5 py-2.5",
                      "align-middle text-[var(--clicks-text)]",
                      col.className,
                    )}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
