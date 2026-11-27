"use client";

import { Gamepad2, House, LogOut, Settings, UserPlus } from "lucide-react";
import type { ReactNode } from "react";

import { ParentShell } from "@/components/layout/ParentShell";
import { signOutAction } from "@/features/auth/actions";

const ITEMS = [
  { id: "family", label: "Gia đình", href: "/parent", icon: <House /> },
  {
    id: "add",
    label: "Thêm bé",
    href: "/parent/children/new",
    icon: <UserPlus />,
  },
  {
    id: "learn",
    label: "Cho bé học",
    href: "/student/profiles",
    icon: <Gamepad2 />,
  },
  {
    id: "settings",
    label: "Cài đặt",
    href: "/parent/settings",
    icon: <Settings />,
  },
] as const;

/**
 * Parent area frame: navigation + sign-out (a real form POST). Each page
 * passes its nav id, so the frame stays part of the static shell.
 */
export function ParentFrame({
  currentId,
  children,
}: {
  currentId?: (typeof ITEMS)[number]["id"];
  children: ReactNode;
}) {
  return (
    <ParentShell
      items={ITEMS}
      currentId={currentId}
      actions={
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex min-h-11 items-center gap-2 rounded-pill px-4 text-body font-bold text-ink-muted hover:bg-surface hover:text-ink [&_svg]:size-5"
          >
            <LogOut aria-hidden />
            Đăng xuất
          </button>
        </form>
      }
    >
      <main>{children}</main>
    </ParentShell>
  );
}
