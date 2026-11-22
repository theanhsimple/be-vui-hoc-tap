"use client";

import { useId } from "react";

import { cn } from "@/lib/cn";

export interface LittleSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

/** On/off setting. The whole row (≥ 44 px) is the touch target. */
export function LittleSwitch({
  checked,
  onCheckedChange,
  label,
  description,
  disabled,
  className,
}: LittleSwitchProps) {
  const descId = useId();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-describedby={description ? descId : undefined}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "group flex min-h-11 w-full items-center justify-between gap-4 rounded-sm py-2 text-left",
        "disabled:cursor-not-allowed disabled:text-disabled-ink",
        className,
      )}
    >
      <span className="min-w-0">
        <span className="block text-body font-bold">{label}</span>
        {description && (
          <span
            id={descId}
            className="block text-body-sm text-ink-muted group-disabled:text-disabled-ink"
          >
            {description}
          </span>
        )}
      </span>
      <span
        aria-hidden
        className={cn(
          "relative inline-flex h-8 w-14 shrink-0 items-center rounded-pill p-1 transition-colors duration-200",
          checked ? "bg-blue-strong" : "bg-border-strong",
          "group-disabled:bg-disabled group-disabled:ring-1 group-disabled:ring-border",
        )}
      >
        <span
          className={cn(
            "size-6 rounded-pill bg-surface shadow-xs transition-transform duration-200 ease-standard motion-reduce:transition-none",
            checked && "translate-x-6",
          )}
        />
      </span>
    </button>
  );
}
