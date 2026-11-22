import { ChevronDown } from "lucide-react";
import {
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  forwardRef,
} from "react";

import { cn } from "@/lib/cn";

const FIELD =
  "w-full rounded-sm border bg-surface text-body text-ink placeholder:text-ink-muted transition-[border-color,box-shadow] duration-200 " +
  "border-border-strong hover:border-ink-muted focus-visible:border-blue-strong focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue/40 " +
  "disabled:cursor-not-allowed disabled:border-border disabled:bg-disabled disabled:text-disabled-ink " +
  "aria-[invalid=true]:border-error-strong aria-[invalid=true]:focus-visible:ring-error/40";

const HEIGHT = { sm: "min-h-10 px-3", md: "min-h-12 px-4" } as const;

export interface LittleInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size"
> {
  size?: keyof typeof HEIGHT;
  invalid?: boolean;
  /** Decorative leading icon (e.g. search). */
  icon?: ReactNode;
}

export const LittleInput = forwardRef<HTMLInputElement, LittleInputProps>(
  function LittleInput(
    { size = "md", invalid, icon, className, ...rest },
    ref,
  ) {
    const input = (
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(FIELD, HEIGHT[size], icon && "pl-10", className)}
        {...rest}
      />
    );
    if (!icon) return input;
    return (
      <span className="relative block w-full">
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted [&_svg]:size-5"
        >
          {icon}
        </span>
        {input}
      </span>
    );
  },
);

export interface LittleSelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "size"
> {
  size?: keyof typeof HEIGHT;
  invalid?: boolean;
}

/** Native select (best on iPad: uses the system picker), styled to match. */
export const LittleSelect = forwardRef<HTMLSelectElement, LittleSelectProps>(
  function LittleSelect(
    { size = "md", invalid, className, children, ...rest },
    ref,
  ) {
    return (
      <span className="relative block w-full">
        <select
          ref={ref}
          aria-invalid={invalid || undefined}
          className={cn(
            FIELD,
            HEIGHT[size],
            "appearance-none pr-10",
            className,
          )}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-ink-muted"
        />
      </span>
    );
  },
);
