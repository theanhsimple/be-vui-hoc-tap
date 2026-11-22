import type { z } from "zod";

/** Result of a form Server Function (used with useActionState). */
export interface FormState {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string>;
  /**
   * Submitted values echoed back (never passwords): React resets forms after
   * an action, so fields use these as their default value on error.
   */
  values?: Record<string, string>;
}

export const IDLE: FormState = { status: "idle" };

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

export function formError(
  message: string,
  values?: Record<string, string>,
): FormState {
  return { status: "error", message, values };
}

/** Echo selected text fields of a form (for re-filling after an error). */
export function echo(form: FormData, names: readonly string[]) {
  const out: Record<string, string> = {};
  for (const n of names) {
    const v = form.get(n);
    if (typeof v === "string") out[n] = v.slice(0, 200);
  }
  return out;
}
