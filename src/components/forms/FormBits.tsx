"use client";

import { CircleCheck, CircleAlert } from "lucide-react";
import type { InputHTMLAttributes } from "react";

import { AdminFormField } from "@/components/admin/AdminFormField";
import { LittleInput } from "@/components/ui/LittleInput";
import type { FormState } from "@/features/forms";

/** Labelled text input wired to a form state's field errors. */
export function TextField({
  label,
  name,
  state,
  hint,
  ...input
}: {
  label: string;
  name: string;
  state: FormState;
  hint?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "name" | "size">) {
  return (
    <AdminFormField
      label={label}
      hint={hint}
      error={state.fieldErrors?.[name]}
      required={input.required}
    >
      {(control) => (
        <LittleInput
          {...input}
          defaultValue={state.values?.[name] ?? input.defaultValue}
          name={name}
          id={control.id}
          aria-describedby={control["aria-describedby"]}
          invalid={control.invalid}
        />
      )}
    </AdminFormField>
  );
}

/** Form-level success / error message, announced to screen readers. */
export function FormMessage({ state }: { state: FormState }) {
  if (!state.message) return null;
  const ok = state.status === "success";
  return (
    <p
      role={ok ? "status" : "alert"}
      className={
        ok
          ? "flex items-start gap-2 rounded-md bg-success-50 p-3 text-body font-semibold text-success-strong"
          : "flex items-start gap-2 rounded-md bg-error-50 p-3 text-body font-semibold text-error-strong"
      }
    >
      {ok ? (
        <CircleCheck aria-hidden className="mt-0.5 size-5 shrink-0" />
      ) : (
        <CircleAlert aria-hidden className="mt-0.5 size-5 shrink-0" />
      )}
      {state.message}
    </p>
  );
}
