import type { ReactNode } from "react";

import { Breadcrumb, type BreadcrumbItem } from "../navigation/Breadcrumb";

export interface AdminPageHeaderProps {
  title: string;
  description?: string;
  breadcrumb?: readonly BreadcrumbItem[];
  actions?: ReactNode;
}

export function AdminPageHeader({
  title,
  description,
  breadcrumb,
  actions,
}: AdminPageHeaderProps) {
  return (
    <header className="flex flex-col gap-3 border-b border-border pb-5">
      {breadcrumb && <Breadcrumb items={breadcrumb} />}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-h1">{title}</h1>
          {description && (
            <p className="mt-1 max-w-2xl text-body text-ink-muted">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}
