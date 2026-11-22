import { ChevronRight } from "lucide-react";
import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/** Location trail for parent/admin. The last item is the current page. */
export function Breadcrumb({ items }: { items: readonly BreadcrumbItem[] }) {
  return (
    <nav aria-label="Vị trí trang">
      <ol className="flex flex-wrap items-center gap-1 text-body-sm text-ink-muted">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1">
              {item.href && !last ? (
                <Link
                  href={item.href}
                  className="rounded-sm px-1 py-0.5 font-semibold text-blue-strong hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={last ? "page" : undefined}
                  className={last ? "font-bold text-ink" : undefined}
                >
                  {item.label}
                </span>
              )}
              {!last && <ChevronRight aria-hidden className="size-4" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
