import type { MouseEvent, ReactNode } from "react";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  /** Lucide icon element (functional icons only). */
  icon?: ReactNode;
}

export interface NavProps {
  items: readonly NavItem[];
  currentId?: string;
  /** Optional hook, e.g. to intercept navigation in previews. */
  onNavigate?: (id: string, event: MouseEvent<HTMLAnchorElement>) => void;
}
