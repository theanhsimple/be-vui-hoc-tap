import { type ReactNode, useId } from "react";

import type { BrandTone } from "@/design-system/tokens";

/**
 * PLACEHOLDER illustrations — simple "clay" SVGs so components can be built
 * and reviewed before real 3D-rendered assets exist. They are intentionally
 * plain and must not be presented as final art. Replace by registering an
 * image asset under the same name in registry.ts; no component changes needed.
 */

export const TONE_VARS: Record<
  BrandTone,
  { tint: string; base: string; edge: string }
> = {
  blue: {
    tint: "var(--blue-50)",
    base: "var(--blue)",
    edge: "var(--blue-edge)",
  },
  yellow: {
    tint: "var(--yellow-50)",
    base: "var(--yellow)",
    edge: "var(--yellow-edge)",
  },
  coral: {
    tint: "var(--coral-50)",
    base: "var(--coral)",
    edge: "var(--coral-edge)",
  },
  mint: {
    tint: "var(--mint-50)",
    base: "var(--mint)",
    edge: "var(--mint-edge)",
  },
  lavender: {
    tint: "var(--lavender-50)",
    base: "var(--lavender)",
    edge: "var(--lavender-edge)",
  },
};

/** Provides clay gradients `${id}-{tone}` for every brand tone. */
function ClayDefs({ id }: { id: string }) {
  return (
    <defs>
      {(Object.keys(TONE_VARS) as BrandTone[]).map((tone) => {
        const v = TONE_VARS[tone];
        return (
          <radialGradient
            key={tone}
            id={`${id}-${tone}`}
            cx="35%"
            cy="28%"
            r="75%"
          >
            <stop offset="0%" style={{ stopColor: v.tint }} />
            <stop offset="55%" style={{ stopColor: v.base }} />
            <stop offset="100%" style={{ stopColor: v.edge }} />
          </radialGradient>
        );
      })}
    </defs>
  );
}

/** Round trig-derived coordinates so server and client render identical attributes. */
export const r2 = (n: number) => Math.round(n * 100) / 100;

export type Draw = (fill: (tone: BrandTone) => string) => ReactNode;

export function Clay({
  draw,
  shadow = true,
}: {
  draw: Draw;
  shadow?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  const fill = (tone: BrandTone) => `url(#${id}-${tone})`;
  return (
    <>
      <ClayDefs id={id} />
      {shadow && (
        <ellipse
          cx="60"
          cy="108"
          rx="34"
          ry="5"
          style={{ fill: "var(--ink)" }}
          opacity="0.1"
        />
      )}
      {draw(fill)}
    </>
  );
}

const island = (fill: (t: BrandTone) => string, tone: BrandTone) => (
  <>
    <ellipse
      cx="60"
      cy="94"
      rx="50"
      ry="13"
      style={{ fill: TONE_VARS[tone].edge }}
    />
    <ellipse cx="60" cy="88" rx="50" ry="13" fill={fill(tone)} />
  </>
);

export const PLACEHOLDER_ART = {
  // ── Shapes & objects ──
  "shape.circle": () => (
    <Clay draw={(f) => <circle cx="60" cy="58" r="36" fill={f("blue")} />} />
  ),
  "shape.triangle": () => (
    <Clay
      draw={(f) => (
        <path
          d="M60 18q5 0 8 5l32 58q4 9-6 9H26q-10 0-6-9l32-58q3-5 8-5z"
          fill={f("coral")}
        />
      )}
    />
  ),
  "shape.square": () => (
    <Clay
      draw={(f) => (
        <rect x="24" y="22" width="72" height="72" rx="16" fill={f("mint")} />
      )}
    />
  ),
  "shape.star": () => (
    <Clay
      draw={(f) => (
        <path
          d="M60 16l12 26 28 4-20 20 5 28-25-14-25 14 5-28-20-20 28-4z"
          fill={f("yellow")}
          strokeLinejoin="round"
        />
      )}
    />
  ),
  "object.ball": () => (
    <Clay
      draw={(f) => (
        <>
          <circle cx="60" cy="58" r="38" fill={f("coral")} />
          <path
            d="M26 46q34 10 68 0"
            style={{ stroke: "var(--surface)" }}
            strokeWidth="7"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M28 72q32 12 64 0"
            style={{ stroke: "var(--yellow)" }}
            strokeWidth="7"
            fill="none"
            strokeLinecap="round"
          />
          <ellipse cx="46" cy="36" rx="10" ry="6" fill="#fff" opacity="0.55" />
        </>
      )}
    />
  ),
  "reward.sticker-star": () => (
    <Clay
      draw={(f) => (
        <>
          <circle cx="60" cy="58" r="42" style={{ fill: "var(--surface)" }} />
          <circle
            cx="60"
            cy="58"
            r="42"
            fill="none"
            style={{ stroke: "var(--yellow-edge)" }}
            strokeWidth="3"
            strokeDasharray="6 6"
          />
          <path
            d="M60 26l9 19 21 3-15 15 4 21-19-10-19 10 4-21-15-15 21-3z"
            fill={f("yellow")}
          />
        </>
      )}
    />
  ),

  // ── Worlds (placeholder islands with a simple motif) ──
  "world.alphabet-forest": () => (
    <Clay
      shadow={false}
      draw={(f) => (
        <>
          {island(f, "mint")}
          <rect
            x="38"
            y="62"
            width="6"
            height="18"
            rx="3"
            style={{ fill: "var(--yellow-edge)" }}
          />
          <path d="M41 22l20 42H21z" fill={f("mint")} />
          <rect
            x="74"
            y="66"
            width="6"
            height="14"
            rx="3"
            style={{ fill: "var(--yellow-edge)" }}
          />
          <path d="M77 38l16 32H61z" fill={f("mint")} />
        </>
      )}
    />
  ),
  "world.number-kingdom": () => (
    <Clay
      shadow={false}
      draw={(f) => (
        <>
          {island(f, "yellow")}
          <rect
            x="44"
            y="34"
            width="32"
            height="48"
            rx="6"
            fill={f("yellow")}
          />
          <path
            d="M44 34h8v-8h8v8h0v-8h8v8h8"
            style={{ fill: "var(--yellow)" }}
          />
          <rect
            x="54"
            y="60"
            width="12"
            height="22"
            rx="6"
            style={{ fill: "var(--yellow-edge)" }}
          />
          <path
            d="M60 26V12l14 6-14 6"
            style={{ fill: "var(--coral)", stroke: "var(--coral-edge)" }}
            strokeWidth="2"
          />
        </>
      )}
    />
  ),
  "world.iq-castle": () => (
    <Clay
      shadow={false}
      draw={(f) => (
        <>
          {island(f, "lavender")}
          <rect
            x="30"
            y="36"
            width="20"
            height="46"
            rx="5"
            fill={f("lavender")}
          />
          <rect
            x="70"
            y="36"
            width="20"
            height="46"
            rx="5"
            fill={f("lavender")}
          />
          <rect
            x="44"
            y="50"
            width="32"
            height="32"
            rx="5"
            fill={f("lavender")}
          />
          <path
            d="M30 36l10-14 10 14zM70 36l10-14 10 14z"
            style={{ fill: "var(--lavender-edge)" }}
          />
          <rect
            x="54"
            y="62"
            width="12"
            height="20"
            rx="6"
            style={{ fill: "var(--lavender-edge)" }}
          />
        </>
      )}
    />
  ),
  "world.memory-garden": () => (
    <Clay
      shadow={false}
      draw={(f) => (
        <>
          {island(f, "mint")}
          {[38, 60, 82].map((x, i) => (
            <g key={x}>
              <rect
                x={x - 2}
                y={56 - i * 4}
                width="4"
                height={26 + i * 4}
                rx="2"
                style={{ fill: "var(--mint-edge)" }}
              />
              <circle
                cx={x}
                cy={50 - i * 4}
                r="11"
                fill={f(i === 1 ? "yellow" : "coral")}
              />
              <circle
                cx={x}
                cy={50 - i * 4}
                r="4"
                style={{ fill: "var(--surface)" }}
              />
            </g>
          ))}
        </>
      )}
    />
  ),
  "world.english-island": () => (
    <Clay
      shadow={false}
      draw={(f) => (
        <>
          {island(f, "blue")}
          <circle cx="78" cy="34" r="14" fill={f("yellow")} />
          <rect
            x="44"
            y="40"
            width="6"
            height="42"
            rx="3"
            style={{ fill: "var(--yellow-edge)" }}
          />
          <path
            d="M47 40q-18-6-24 6q12-4 24-6q-4-16 12-20q-10 10-12 20q18-4 22 8q-12-6-22-8z"
            fill={f("mint")}
          />
        </>
      )}
    />
  ),
  "world.school-town": () => (
    <Clay
      shadow={false}
      draw={(f) => (
        <>
          {island(f, "yellow")}
          <rect x="34" y="48" width="52" height="34" rx="6" fill={f("blue")} />
          <path d="M28 50l32-26 32 26z" fill={f("coral")} />
          <rect
            x="54"
            y="62"
            width="12"
            height="20"
            rx="4"
            style={{ fill: "var(--blue-edge)" }}
          />
          <circle cx="60" cy="40" r="5" style={{ fill: "var(--surface)" }} />
        </>
      )}
    />
  ),
  "world.challenge-arena": () => (
    <Clay
      shadow={false}
      draw={(f) => (
        <>
          {island(f, "coral")}
          <path d="M40 26h40v14q0 22-20 26q-20-4-20-26z" fill={f("yellow")} />
          <rect
            x="56"
            y="64"
            width="8"
            height="10"
            style={{ fill: "var(--yellow-edge)" }}
          />
          <rect x="44" y="72" width="32" height="8" rx="4" fill={f("yellow")} />
        </>
      )}
    />
  ),

  // ── Avatars (fixed catalogue, no photos) ──
  "avatar.sun": () => (
    <Clay
      shadow={false}
      draw={(f) => (
        <>
          <circle cx="60" cy="60" r="56" style={{ fill: "var(--yellow-50)" }} />
          <circle cx="60" cy="60" r="26" fill={f("yellow")} />
          {Array.from({ length: 8 }, (_, i) => (
            <circle
              key={i}
              cx={r2(60 + 38 * Math.cos((i * Math.PI) / 4))}
              cy={r2(60 + 38 * Math.sin((i * Math.PI) / 4))}
              r="5"
              style={{ fill: "var(--yellow)" }}
            />
          ))}
        </>
      )}
    />
  ),
  "avatar.cloud": () => (
    <Clay
      shadow={false}
      draw={(f) => (
        <>
          <circle cx="60" cy="60" r="56" style={{ fill: "var(--blue-50)" }} />
          <path
            d="M36 76a14 14 0 0 1 2-28a18 18 0 0 1 34-6a14 14 0 0 1 12 34z"
            fill={f("blue")}
          />
        </>
      )}
    />
  ),
  "avatar.leaf": () => (
    <Clay
      shadow={false}
      draw={(f) => (
        <>
          <circle cx="60" cy="60" r="56" style={{ fill: "var(--mint-50)" }} />
          <path d="M34 82q0-46 52-50q2 50-52 50z" fill={f("mint")} />
        </>
      )}
    />
  ),
  "avatar.flower": () => (
    <Clay
      shadow={false}
      draw={(f) => (
        <>
          <circle cx="60" cy="60" r="56" style={{ fill: "var(--coral-50)" }} />
          {Array.from({ length: 5 }, (_, i) => (
            <circle
              key={i}
              cx={r2(60 + 18 * Math.cos((i * 2 * Math.PI) / 5))}
              cy={r2(60 + 18 * Math.sin((i * 2 * Math.PI) / 5))}
              r="13"
              fill={f("coral")}
            />
          ))}
          <circle cx="60" cy="60" r="9" style={{ fill: "var(--yellow)" }} />
        </>
      )}
    />
  ),
  "avatar.moon": () => (
    <Clay
      shadow={false}
      draw={(f) => (
        <>
          <circle
            cx="60"
            cy="60"
            r="56"
            style={{ fill: "var(--lavender-50)" }}
          />
          <path
            d="M70 28a32 32 0 1 0 16 52a26 26 0 1 1-16-52z"
            fill={f("lavender")}
          />
        </>
      )}
    />
  ),
  "avatar.drop": () => (
    <Clay
      shadow={false}
      draw={(f) => (
        <>
          <circle cx="60" cy="60" r="56" style={{ fill: "var(--blue-50)" }} />
          <path
            d="M60 24q24 30 24 44a24 24 0 0 1-48 0q0-14 24-44z"
            fill={f("blue")}
          />
        </>
      )}
    />
  ),

  // ── States ──
  "state.empty": () => (
    <Clay
      draw={(f) => (
        <>
          <path d="M26 52l34-14 34 14v36l-34 14-34-14z" fill={f("lavender")} />
          <path
            d="M26 52l34 14 34-14M60 66v36"
            style={{ stroke: "var(--lavender-edge)" }}
            strokeWidth="3"
            fill="none"
          />
          <path
            d="M60 14v10M44 20l5 8M76 20l-5 8"
            style={{ stroke: "var(--yellow-edge)" }}
            strokeWidth="4"
            strokeLinecap="round"
          />
        </>
      )}
    />
  ),
  "state.error": () => (
    <Clay
      draw={(f) => (
        <>
          <path
            d="M32 74a16 16 0 0 1 2-32a20 20 0 0 1 38-6a16 16 0 0 1 14 38z"
            fill={f("blue")}
          />
          <path
            d="M44 84l-4 10M60 84l-4 10M76 84l-4 10"
            style={{ stroke: "var(--blue-edge)" }}
            strokeWidth="4"
            strokeLinecap="round"
          />
        </>
      )}
    />
  ),
} satisfies Record<string, () => ReactNode>;
