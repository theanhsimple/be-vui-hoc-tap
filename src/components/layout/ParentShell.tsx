import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

import { BottomNavigation } from "../navigation/BottomNavigation";
import { ParentNavigation } from "../navigation/ParentNavigation";
import type { NavProps } from "../navigation/types";
import { LittleContainer } from "../ui/LittleContainer";

export interface ParentShellProps extends NavProps {
  actions?: ReactNode;
  children: ReactNode;
  /** "static" keeps the mobile tab bar inside the frame (previews). */
  bottomNavPosition?: "fixed" | "static";
  className?: string;
}

/** Calm, spacious parent frame: header nav ≥ 640 px, bottom tab bar below. */
export function ParentShell({
  actions,
  children,
  bottomNavPosition = "fixed",
  className,
  ...nav
}: ParentShellProps) {
  return (
    <div className={cn("min-h-full bg-canvas text-ink", className)}>
      <ParentNavigation {...nav} actions={actions} />
      <LittleContainer
        className={cn(
          "py-6 tablet:py-8",
          bottomNavPosition === "fixed" && "pb-24 tablet:pb-8",
        )}
      >
        {children}
      </LittleContainer>
      <BottomNavigation
        {...nav}
        position={bottomNavPosition}
        className="tablet:hidden"
      />
    </div>
  );
}
