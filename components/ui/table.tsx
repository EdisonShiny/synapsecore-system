"use client";

import { cn } from "@/lib/utils";

export type DataTableColumn<T> = {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
};

type DataTableShellProps<T> = {
  columns: Array<DataTableColumn<T>>;
  rows: T[];
  getRowKey: (row: T, index: number) => string;
  emptyMessage?: string;
};

export function DataTableShell<T>({
  columns,
  rows,
  getRowKey,
  emptyMessage = "No rows available."
}: DataTableShellProps<T>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-synapse-border bg-synapse-card">
      <div className="max-h-[520px] overflow-auto">
        <table className="w-full border-collapse text-left text-body">
          <thead className="sticky top-0 z-10 bg-synapse-elevated text-meta uppercase tracking-[0.08em] text-synapse-muted">
            <tr>
              {columns.map((column) => (
                <th key={String(column.key)} className={cn("border-b border-synapse-border px-4 py-3", column.className)}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-synapse-muted" colSpan={columns.length}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={getRowKey(row, index)} className="border-b border-synapse-border/70 transition hover:bg-synapse-elevated/75">
                  {columns.map((column) => (
                    <td key={String(column.key)} className={cn("px-4 py-4 align-middle text-synapse-text", column.className)}>
                      {column.render ? column.render(row) : String(row[column.key as keyof T] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
