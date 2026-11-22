"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";

import { StudentShell } from "../layout/StudentShell";
import { StudentNavigation } from "../navigation/StudentNavigation";
import { LittleStatePanel } from "../ui/LittleStatePanel";
import { ParentPanel } from "./ParentPanel";

export interface StudentScreenProps {
  children: ReactNode;
  /** Where the back button goes. Omit on top-level screens. */
  backHref?: string;
  backLabel?: string;
  center?: ReactNode;
  start?: ReactNode;
  end?: ReactNode;
  /** True while data is loading — shows a calm loading state. */
  loading?: boolean;
  align?: "center" | "start";
}

/** Standard student page: world backdrop, child navigation, gated parent panel. */
export function StudentScreen({
  children,
  backHref,
  backLabel,
  center,
  start,
  end,
  loading,
  align = "start",
}: StudentScreenProps) {
  const router = useRouter();
  const [parentOpen, setParentOpen] = useState(false);
  return (
    <StudentShell
      align={align}
      navigation={
        <StudentNavigation
          onBack={backHref ? () => router.push(backHref) : undefined}
          backLabel={backLabel}
          center={center}
          start={start}
          end={end}
          onParentAccess={() => setParentOpen(true)}
        />
      }
    >
      {loading ? (
        <LittleStatePanel kind="loading" title="Đang chuẩn bị…" />
      ) : (
        children
      )}
      <ParentPanel open={parentOpen} onClose={() => setParentOpen(false)} />
    </StudentShell>
  );
}
