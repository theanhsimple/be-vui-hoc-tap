"use client";

import { Search } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

import { LittleInput } from "../ui/LittleInput";

export interface FilterOption<T extends string> {
  value: T;
  label: string;
}

export interface AdminFilterBarProps<T extends string> {
  query: string;
  onQueryChange: (query: string) => void;
  searchLabel?: string;
  filters?: readonly FilterOption<T>[];
  /** Selected filter values; empty = all. */
  active?: readonly T[];
  onActiveChange?: (active: T[]) => void;
  resultCount?: number;
  actions?: ReactNode;
}

/** Search + toggle chips + result count for admin lists. Fully controlled. */
export function AdminFilterBar<T extends string>({
  query,
  onQueryChange,
  searchLabel = "Tìm kiếm",
  filters = [],
  active = [],
  onActiveChange,
  resultCount,
  actions,
}: AdminFilterBarProps<T>) {
  const toggle = (v: T) =>
    onActiveChange?.(
      active.includes(v) ? active.filter((a) => a !== v) : [...active, v],
    );
  return (
    <div
      role="search"
      className="flex flex-col gap-3 rounded-lg bg-surface-muted p-3 tablet:flex-row tablet:flex-wrap tablet:items-center"
    >
      <div className="tablet:w-72">
        <LittleInput
          size="sm"
          type="search"
          icon={<Search />}
          aria-label={searchLabel}
          placeholder={`${searchLabel}…`}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </div>
      {filters.length > 0 && (
        <div
          role="group"
          aria-label="Lọc theo trạng thái"
          className="flex flex-wrap gap-2"
        >
          {filters.map((f) => {
            const on = active.includes(f.value);
            return (
              <button
                key={f.value}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(f.value)}
                className={cn(
                  "min-h-10 rounded-pill px-4 text-body-sm font-bold ring-1 transition-colors duration-200 ring-inset",
                  on
                    ? "bg-blue-50 text-blue-strong ring-blue-strong"
                    : "bg-surface text-ink-muted ring-border-strong hover:text-ink",
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      )}
      <div className="flex items-center gap-3 tablet:ml-auto">
        {resultCount !== undefined && (
          <p aria-live="polite" className="text-body-sm text-ink-muted">
            {resultCount} kết quả
          </p>
        )}
        {actions}
      </div>
    </div>
  );
}
