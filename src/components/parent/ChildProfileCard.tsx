import type { ReactNode } from "react";

import { LittleAvatar, type AvatarKey } from "../ui/LittleAvatar";
import { LittleCard } from "../ui/LittleCard";

export interface ChildProfileCardProps {
  nickname: string;
  avatar: AvatarKey;
  /** e.g. "5 tuổi". */
  ageLabel: string;
  /** e.g. "Học lần cuối: hôm qua". */
  lastActive?: string;
  actions?: ReactNode;
}

export function ChildProfileCard({
  nickname,
  avatar,
  ageLabel,
  lastActive,
  actions,
}: ChildProfileCardProps) {
  return (
    <LittleCard className="flex flex-wrap items-center gap-4">
      <LittleAvatar name={nickname} avatar={avatar} size="lg" decorative />
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-h3">{nickname}</h3>
        <p className="text-body-sm text-ink-muted">
          {ageLabel}
          {lastActive && ` · ${lastActive}`}
        </p>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </LittleCard>
  );
}
