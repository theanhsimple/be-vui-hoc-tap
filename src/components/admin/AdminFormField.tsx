"use client";

import { CircleAlert } from "lucide-react";
import { type ReactNode, useId } from "react";

import { cn } from "@/lib/cn";

export interface FieldControlProps {
  id: string;
  "aria-describedby"?: string;
  invalid: boolean;
  required?: boolean;
}

export interface AdminFormFieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  /** Render the control with the wiring it needs (id, aria-describedby, invalid). */
  children: (control: FieldControlProps) => ReactNode;
  className?: string;
}

/** Label + control + hint + error, wired for screen readers. */
export function AdminFormField({
  label,
  hint,
  error,
  required,
  children,
  className,
}: AdminFormFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy =
    [hint && hintId, error && errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-body-sm font-bold text-ink">
        {label}
        {required && (
          <span className="text-error-strong" aria-hidden>
            {" "}
            *
          </span>
        )}
      </label>
      {children({
        id,
        "aria-describedby": describedBy,
        invalid: Boolean(error),
        required,
      })}
      {hint && (
        <p id={hintId} className="text-body-sm text-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={errorId}
          className="flex items-center gap-1.5 text-body-sm font-semibold text-error-strong"
        >
          <CircleAlert aria-hidden className="size-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
