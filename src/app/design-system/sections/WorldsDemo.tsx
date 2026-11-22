import { LittleBadge } from "@/components/ui/LittleBadge";
import { LittleCard } from "@/components/ui/LittleCard";
import { LittleIllustration } from "@/components/ui/LittleIllustration";
import { LEARNING_WORLDS } from "@/design-system/worlds";
import { ILLUSTRATION_NAMES, assetPath } from "@/illustrations/registry";

import { Demo, Section } from "./Section";

export function WorldsDemo() {
  return (
    <Section
      id="illustration"
      title="Minh hoạ & 7 thế giới học tập"
      intro="Functional icons come from Lucide. Learning art comes from the illustration registry. Everything below is a PLACEHOLDER drawn in SVG; final 3D renders replace it by registry name without code changes."
    >
      <LittleBadge tone="warning">
        Hình tạm — không phải tài sản thiết kế cuối cùng
      </LittleBadge>
      <Demo title="Learning worlds">
        <div className="grid grid-cols-2 gap-4 tablet:grid-cols-4 desktop:grid-cols-7">
          {LEARNING_WORLDS.map((w) => (
            <LittleCard
              key={w.id}
              surface={w.tone}
              padding="sm"
              elevation="xs"
              className="flex flex-col items-center gap-2 text-center"
            >
              <LittleIllustration
                name={w.illustration}
                alt={w.nameVi}
                className="w-24"
              />
              <p className="text-body font-bold">{w.nameVi}</p>
              <p className="text-caption text-ink-muted">{w.nameEn}</p>
            </LittleCard>
          ))}
        </div>
      </Demo>
      <Demo
        title="Registry"
        note="Key → future file path. Naming: {category}.{kebab-name} → /illustrations/{category}/{kebab-name}@2x.webp"
      >
        <div className="grid grid-cols-3 gap-3 tablet:grid-cols-6 desktop:grid-cols-8">
          {ILLUSTRATION_NAMES.map((name) => (
            <figure
              key={name}
              className="flex flex-col items-center gap-1 rounded-md bg-surface p-2 shadow-xs"
            >
              <LittleIllustration name={name} decorative className="w-16" />
              <figcaption
                className="w-full truncate text-center text-caption text-ink-muted"
                title={assetPath(name)}
              >
                {name}
              </figcaption>
            </figure>
          ))}
        </div>
      </Demo>
    </Section>
  );
}
