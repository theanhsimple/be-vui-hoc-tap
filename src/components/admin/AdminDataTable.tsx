import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

import { LittleStatePanel } from "../ui/LittleStatePanel";

export interface AdminColumn<Row> {
  key: string;
  header: string;
  cell: (row: Row) => ReactNode;
  align?: "start" | "end";
  /** Hide below 1024 px to keep tables readable on iPad. */
  desktopOnly?: boolean;
  className?: string;
}

export interface AdminDataTableProps<Row> {
  /** Accessible table caption (visually hidden). */
  caption: string;
  columns: readonly AdminColumn<Row>[];
  rows: readonly Row[];
  getRowId: (row: Row) => string;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
}

/** Typed, responsive data table with loading and empty states. */
export function AdminDataTable<Row>({
  caption,
  columns,
  rows,
  getRowId,
  loading,
  emptyTitle = "Chưa có dữ liệu",
  emptyDescription,
  emptyAction,
}: AdminDataTableProps<Row>) {
  if (loading)
    return <LittleStatePanel kind="loading" title="Đang tải danh sách…" />;
  if (rows.length === 0)
    return (
      <LittleStatePanel
        kind="empty"
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );

  return (
    <div className="overflow-x-auto rounded-lg ring-1 ring-border">
      <table className="w-full border-collapse text-left text-body-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-surface-muted text-caption text-ink-muted uppercase">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={cn(
                  "px-4 py-3 font-bold whitespace-nowrap",
                  c.align === "end" && "text-right",
                  c.desktopOnly && "hidden desktop:table-cell",
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-surface">
          {rows.map((row) => (
            <tr
              key={getRowId(row)}
              className="transition-colors duration-200 hover:bg-canvas"
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cn(
                    "px-4 py-3 align-middle",
                    c.align === "end" && "text-right",
                    c.desktopOnly && "hidden desktop:table-cell",
                    c.className,
                  )}
                >
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
