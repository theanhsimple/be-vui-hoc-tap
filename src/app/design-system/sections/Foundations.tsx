import { LittleBadge } from "@/components/ui/LittleBadge";
import { LittleCard } from "@/components/ui/LittleCard";
import { SpeechBubble } from "@/components/ui/SpeechBubble";
import {
  ADJUSTMENTS,
  BRAND,
  BRAND_ROLE,
  BRAND_TONES,
  ELEVATION,
  RADIUS,
  SEMANTIC,
  SPACING,
  TYPE_SCALE,
  contrastRatio,
} from "@/design-system/tokens";

import { Demo, Section } from "./Section";

function Ratio({ fg, bg }: { fg: string; bg: string }) {
  const r = contrastRatio(fg, bg);
  return (
    <LittleBadge
      tone={r >= 4.5 ? "success" : r >= 3 ? "warning" : "neutral"}
      size="sm"
    >
      {r.toFixed(1)}:1
    </LittleBadge>
  );
}

export function Foundations() {
  return (
    <>
      <Section
        id="colors"
        title="Màu sắc"
        intro="Brand colours are decorative fills; text on them is always Ink. Functional text, links, icons and focus rings use the darker '-strong' variants. Ratios are computed live from the tokens."
      >
        <Demo title="Brand palette">
          <div className="grid gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
            {BRAND_TONES.map((tone) => {
              const t = BRAND[tone];
              return (
                <LittleCard
                  key={tone}
                  padding="none"
                  className="overflow-hidden"
                >
                  <div
                    className="flex h-20 items-end justify-between p-3"
                    style={{ background: t.base }}
                  >
                    <span className="text-body font-bold">{tone}</span>
                    <Ratio fg={SEMANTIC.ink} bg={t.base} />
                  </div>
                  <div className="grid grid-cols-3 text-caption">
                    {(["tint", "edge", "strong"] as const).map((k) => (
                      <div key={k} className="flex flex-col gap-1 p-3">
                        <span
                          className="h-6 rounded-sm ring-1 ring-border"
                          style={{ background: t[k] }}
                        />
                        <span>{k}</span>
                        <span className="text-ink-muted">{t[k]}</span>
                      </div>
                    ))}
                  </div>
                  <p className="border-t border-border px-3 py-2 text-body-sm text-ink-muted">
                    {BRAND_ROLE[tone]}
                  </p>
                </LittleCard>
              );
            })}
          </div>
        </Demo>
        <Demo title="Semantic tokens">
          <div className="grid grid-cols-2 gap-3 tablet:grid-cols-4 desktop:grid-cols-6">
            {Object.entries(SEMANTIC).map(([name, hex]) => (
              <div
                key={name}
                className="flex items-center gap-2 rounded-md bg-surface p-2 shadow-xs"
              >
                <span
                  className="size-8 shrink-0 rounded-sm ring-1 ring-border"
                  style={{ background: hex }}
                />
                <span className="min-w-0 text-caption">
                  <span className="block truncate">{name}</span>
                  <span className="block text-ink-muted">{hex}</span>
                </span>
              </div>
            ))}
          </div>
        </Demo>
        <Demo title="Accessibility adjustments to the brief's palette">
          <div className="overflow-x-auto rounded-lg ring-1 ring-border">
            <table className="w-full text-left text-body-sm">
              <thead className="bg-surface-muted text-caption text-ink-muted uppercase">
                <tr>
                  <th className="px-4 py-2">Token</th>
                  <th className="px-4 py-2">From → to</th>
                  <th className="px-4 py-2">Why</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {ADJUSTMENTS.map((a) => (
                  <tr key={a.token}>
                    <td className="px-4 py-2 font-bold whitespace-nowrap">
                      {a.token}
                    </td>
                    <td className="px-4 py-2">
                      {a.from} → {a.to}
                    </td>
                    <td className="px-4 py-2 text-ink-muted">{a.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-body-sm">
            <span className="inline-flex items-center gap-2">
              Secondary text on canvas{" "}
              <Ratio fg={SEMANTIC.inkMuted} bg={SEMANTIC.canvas} />
            </span>
            <span className="inline-flex items-center gap-2">
              Original #748094 <Ratio fg="#748094" bg={SEMANTIC.canvas} />
            </span>
            <span className="inline-flex items-center gap-2">
              Focus ring <Ratio fg={SEMANTIC.focus} bg={SEMANTIC.canvas} />
            </span>
          </div>
        </Demo>
      </Section>

      <Section
        id="typography"
        title="Chữ — Nunito Sans"
        intro="Self-hosted by next/font with the Vietnamese subset. Display, H1 and H2 scale down on small screens."
      >
        <Demo title="Type scale">
          <div className="flex flex-col divide-y divide-border rounded-lg bg-surface px-4 shadow-xs">
            {TYPE_SCALE.map((t) => (
              <div
                key={t.token}
                className="grid gap-1 py-3 tablet:grid-cols-[180px_minmax(0,1fr)] tablet:items-baseline"
              >
                <span className="text-caption text-ink-muted">
                  {t.token} · {t.size} · {t.weight}
                </span>
                <span className={t.className}>Bé khám phá thế giới</span>
              </div>
            ))}
          </div>
        </Demo>
        <Demo
          title="Long Vietnamese text & wrapping"
          note="Diacritics stacked on capitals and long words in narrow columns."
        >
          <div className="grid gap-4 tablet:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <LittleCard>
              <h3 className="text-h2">
                Ước mơ trở thành người khổng lồ dũng cảm ở xứ sở Ngưỡng Vọng
              </h3>
              <p className="mt-2 text-body">
                Bé đã hoàn thành chuỗi bài “Nhận biết hình dạng” với sự tập
                trung rất tốt. Trong tuần tới, bố mẹ có thể cùng bé tìm những đồ
                vật hình tròn, hình vuông và hình tam giác quanh nhà — ví dụ
                chiếc đồng hồ, khung ảnh hay miếng bánh — để bé gọi tên và so
                sánh. ẮẰẲẴẶ ẾỀỂỄỆ ỐỒỔỖỘ ỨỪỬỮỰ.
              </p>
            </LittleCard>
            <div className="flex max-w-[240px] flex-col gap-3">
              <SpeechBubble size="parent">
                Hãy chạm vào chiếc xe đạp màu xanh nước biển nhé!
              </SpeechBubble>
              <LittleBadge tone="info">Thành phố Hồ Chí Minh</LittleBadge>
            </div>
          </div>
        </Demo>
      </Section>

      <Section id="spacing" title="Khoảng cách, bo góc & đổ bóng">
        <Demo title="Spacing (4 px base)">
          <div className="flex flex-wrap items-end gap-4">
            {SPACING.map((px) => (
              <div
                key={px}
                className="flex flex-col items-center gap-1 text-caption text-ink-muted"
              >
                <span
                  className="rounded-sm bg-blue"
                  style={{ width: px, height: px }}
                />
                {px}
              </div>
            ))}
          </div>
        </Demo>
        <Demo title="Radius">
          <div className="flex flex-wrap gap-4">
            {Object.entries(RADIUS).map(([name, px]) => (
              <div
                key={name}
                className="flex flex-col items-center gap-1 text-caption text-ink-muted"
              >
                <span
                  className="size-20 bg-lavender-50 ring-2 ring-lavender"
                  style={{ borderRadius: px }}
                />
                {name} · {px === 999 ? "pill" : `${px}px`}
              </div>
            ))}
          </div>
        </Demo>
        <Demo title="Elevation">
          <div className="grid grid-cols-2 gap-6 tablet:grid-cols-4">
            {ELEVATION.map((e, i) => (
              <div
                key={e.token}
                className={
                  ["shadow-xs", "shadow-sm", "shadow-md", "shadow-lg"][i] +
                  " rounded-lg bg-surface p-4"
                }
              >
                <p className="text-body font-bold">{e.token}</p>
                <p className="text-body-sm text-ink-muted">{e.use}</p>
              </div>
            ))}
          </div>
        </Demo>
      </Section>
    </>
  );
}
