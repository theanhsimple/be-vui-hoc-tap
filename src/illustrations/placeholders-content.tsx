import { type ReactNode, useId } from "react";

import type { BrandTone } from "@/design-system/tokens";

import { TONE_VARS } from "./placeholders";

/**
 * PLACEHOLDER art for the Sprint 03 demo content (animals, food, colours,
 * school objects, routines, badges). Simple clay-style SVGs — not final assets.
 * Teaching colours use the --content-* tokens (learning content only).
 */

export type ContentColor =
  "red" | "blue" | "yellow" | "green" | "orange" | "purple" | "brown";
const CONTENT_COLORS: ContentColor[] = [
  "red",
  "blue",
  "yellow",
  "green",
  "orange",
  "purple",
  "brown",
];

type Paint = {
  /** Brand-tone clay gradient. */
  f: (tone: BrandTone) => string;
  /** Learning-content colour clay gradient. */
  c: (color: ContentColor) => string;
};

function Art({
  draw,
  shadow = true,
}: {
  draw: (p: Paint) => ReactNode;
  shadow?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  const stops = (key: string, tint: string, base: string, edge: string) => (
    <radialGradient key={key} id={`${id}-${key}`} cx="35%" cy="28%" r="75%">
      <stop offset="0%" style={{ stopColor: tint }} />
      <stop offset="55%" style={{ stopColor: base }} />
      <stop offset="100%" style={{ stopColor: edge }} />
    </radialGradient>
  );
  return (
    <>
      <defs>
        {(Object.keys(TONE_VARS) as BrandTone[]).map((t) =>
          stops(t, TONE_VARS[t].tint, TONE_VARS[t].base, TONE_VARS[t].edge),
        )}
        {CONTENT_COLORS.map((c) =>
          stops(
            `c-${c}`,
            "#ffffff",
            `var(--content-${c})`,
            `var(--content-${c}-edge)`,
          ),
        )}
      </defs>
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
      {draw({ f: (t) => `url(#${id}-${t})`, c: (c) => `url(#${id}-c-${c})` })}
    </>
  );
}

const INK = { fill: "var(--ink)" } as const;
const line = (w = 3) => ({
  stroke: "var(--ink)",
  strokeWidth: w,
  strokeLinecap: "round" as const,
  fill: "none",
});
const eyes = (y: number, dx = 12, cx = 60) => (
  <>
    <circle cx={cx - dx} cy={y} r="4" style={INK} />
    <circle cx={cx + dx} cy={y} r="4" style={INK} />
    <circle cx={cx - dx + 1.3} cy={y - 1.3} r="1.3" fill="#fff" />
    <circle cx={cx + dx + 1.3} cy={y - 1.3} r="1.3" fill="#fff" />
  </>
);

function blob(paint: string) {
  return (
    <path
      d="M60 18c18 0 34 10 38 26 5 18-4 40-22 48-16 8-38 4-48-10C18 68 18 46 28 32c8-10 18-14 32-14z"
      fill={paint}
    />
  );
}

function medal(
  motif: ReactNode,
  ribbon: BrandTone,
  f: (t: BrandTone) => string,
) {
  return (
    <>
      <path d="M44 8h14l-6 34H38zM62 8h14l6 34H68z" fill={f(ribbon)} />
      <circle cx="60" cy="68" r="34" fill={f("yellow")} />
      <circle cx="60" cy="68" r="26" style={{ fill: "var(--yellow-50)" }} />
      {motif}
    </>
  );
}

export const CONTENT_ART = {
  // ── Animals ──
  "animal.cat": () => (
    <Art
      draw={({ c }) => (
        <>
          <path d="M30 30l8 30h-14zM90 30l6 30H82z" fill={c("orange")} />
          <circle cx="60" cy="64" r="34" fill={c("orange")} />
          {eyes(58)}
          <path d="M57 70h6l-3 4z" style={INK} />
          <path d="M60 74q-6 6-10 2M60 74q6 6 10 2" style={line(2.5)} />
          <path
            d="M36 70h-14M36 76l-12 4M84 70h14M84 76l12 4"
            style={line(2)}
          />
        </>
      )}
    />
  ),
  "animal.dog": () => (
    <Art
      draw={({ c }) => (
        <>
          <ellipse
            cx="30"
            cy="56"
            rx="11"
            ry="22"
            fill={c("brown")}
            transform="rotate(12 30 56)"
          />
          <ellipse
            cx="90"
            cy="56"
            rx="11"
            ry="22"
            fill={c("brown")}
            transform="rotate(-12 90 56)"
          />
          <circle cx="60" cy="62" r="32" style={{ fill: "var(--yellow-50)" }} />
          <circle cx="60" cy="62" r="32" fill={c("yellow")} opacity="0.35" />
          {eyes(54)}
          <ellipse cx="60" cy="70" rx="8" ry="6" style={INK} />
          <path d="M60 76q0 8 -8 8M60 76q0 8 8 8" style={line(2.5)} />
        </>
      )}
    />
  ),
  "animal.fish": () => (
    <Art
      draw={({ c }) => (
        <>
          <path d="M84 58l22-18v36z" fill={c("blue")} />
          <ellipse cx="54" cy="58" rx="36" ry="26" fill={c("blue")} />
          <path
            d="M50 36q8 -12 20 -4"
            style={{ fill: "var(--content-blue-edge)" }}
          />
          <circle cx="36" cy="52" r="5" style={INK} />
          <circle cx="37.5" cy="50.5" r="1.6" fill="#fff" />
          <path
            d="M56 46q6 12 0 24M66 46q6 12 0 24"
            style={{
              stroke: "#fff",
              strokeWidth: 3,
              fill: "none",
              opacity: 0.6,
            }}
          />
        </>
      )}
    />
  ),
  "animal.bird": () => (
    <Art
      draw={({ f, c }) => (
        <>
          <circle cx="58" cy="60" r="34" fill={f("blue")} />
          <path d="M44 62q14 22 30 4" fill={f("lavender")} />
          {eyes(50, 10, 62)}
          <path d="M88 54l16 6-16 6z" fill={c("orange")} />
          <path d="M44 94l-4 10M64 94l-2 10" style={line(3)} />
        </>
      )}
    />
  ),
  "animal.chicken": () => (
    <Art
      draw={({ c }) => (
        <>
          <path d="M50 26q4-12 10-4q4-10 10 0q8-6 8 6z" fill={c("red")} />
          <circle
            cx="60"
            cy="62"
            r="34"
            style={{
              fill: "var(--surface)",
              stroke: "var(--surface-edge)",
              strokeWidth: 3,
            }}
          />
          {eyes(54, 11)}
          <path d="M54 64h12l-6 9z" fill={c("orange")} />
          <path d="M58 74q2 8 -2 10" fill={c("red")} />
        </>
      )}
    />
  ),

  // ── Food ──
  "food.apple": () => (
    <Art
      draw={({ c }) => (
        <>
          <path
            d="M60 34c-8-8-34-8-38 18-4 22 12 48 28 48 6 0 8-3 10-3s4 3 10 3c16 0 32-26 28-48-4-26-30-26-38-18z"
            fill={c("red")}
          />
          <path d="M60 34q2-12 8-18" style={line(4)} />
          <path d="M64 24q14-10 22 0q-12 8-22 0z" fill={c("green")} />
          <ellipse cx="42" cy="50" rx="7" ry="11" fill="#fff" opacity="0.35" />
        </>
      )}
    />
  ),
  "food.banana": () => (
    <Art
      draw={({ c }) => (
        <>
          <path
            d="M24 40q10 54 70 44q8-2 4-8q-48 4-60-40q-2-6-8-4z"
            fill={c("yellow")}
          />
          <path d="M22 38l4-10 6 4z" style={{ fill: "var(--content-brown)" }} />
          <path d="M96 78l6 4-4 4z" style={{ fill: "var(--content-brown)" }} />
        </>
      )}
    />
  ),
  "food.orange": () => (
    <Art
      draw={({ c }) => (
        <>
          <circle cx="60" cy="62" r="36" fill={c("orange")} />
          <path d="M60 26q4-8 10-10" style={line(3)} />
          <path d="M62 24q12-8 18 0q-10 6-18 0z" fill={c("green")} />
          {[
            [48, 50],
            [70, 56],
            [56, 74],
            [76, 76],
            [42, 68],
          ].map(([x, y]) => (
            <circle
              key={`${x}-${y}`}
              cx={x}
              cy={y}
              r="1.6"
              style={{ fill: "var(--content-orange-edge)" }}
            />
          ))}
        </>
      )}
    />
  ),
  "food.grapes": () => (
    <Art
      draw={({ c }) => (
        <>
          <path d="M60 22v12" style={line(4)} />
          <path d="M62 26q12-8 20 0q-10 6-20 0z" fill={c("green")} />
          {[
            [48, 44],
            [72, 44],
            [60, 44],
            [42, 60],
            [54, 60],
            [66, 60],
            [78, 60],
            [48, 76],
            [60, 76],
            [72, 76],
            [54, 92],
            [66, 92],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="9" fill={c("purple")} />
          ))}
        </>
      )}
    />
  ),

  // ── Colours (paint blobs) ──
  "color.red": () => <Art draw={({ c }) => blob(c("red"))} />,
  "color.blue": () => <Art draw={({ c }) => blob(c("blue"))} />,
  "color.yellow": () => <Art draw={({ c }) => blob(c("yellow"))} />,
  "color.green": () => <Art draw={({ c }) => blob(c("green"))} />,
  "color.orange": () => <Art draw={({ c }) => blob(c("orange"))} />,
  "color.purple": () => <Art draw={({ c }) => blob(c("purple"))} />,

  // ── School objects ──
  "object.book": () => (
    <Art
      draw={({ f }) => (
        <>
          <rect x="28" y="22" width="64" height="80" rx="8" fill={f("blue")} />
          <rect
            x="36"
            y="22"
            width="56"
            height="74"
            rx="6"
            style={{ fill: "var(--surface)" }}
          />
          <rect x="36" y="22" width="52" height="70" rx="6" fill={f("blue")} />
          <rect
            x="46"
            y="38"
            width="32"
            height="10"
            rx="4"
            style={{ fill: "var(--surface)" }}
            opacity="0.85"
          />
        </>
      )}
    />
  ),
  "object.pencil": () => (
    <Art
      draw={({ f, c }) => (
        <g transform="rotate(-40 60 60)">
          <rect
            x="22"
            y="50"
            width="64"
            height="20"
            rx="4"
            fill={c("yellow")}
          />
          <rect x="14" y="50" width="12" height="20" rx="4" fill={f("coral")} />
          <path
            d="M86 50l18 10-18 10z"
            style={{ fill: "var(--surface-edge)" }}
          />
          <path d="M98 57l6 3-6 3z" style={INK} />
        </g>
      )}
    />
  ),
  "object.backpack": () => (
    <Art
      draw={({ f }) => (
        <>
          <path
            d="M46 28q14-14 28 0"
            style={{
              stroke: "var(--coral-edge)",
              strokeWidth: 6,
              fill: "none",
            }}
          />
          <rect
            x="28"
            y="30"
            width="64"
            height="74"
            rx="22"
            fill={f("coral")}
          />
          <rect
            x="40"
            y="64"
            width="40"
            height="28"
            rx="10"
            fill={f("yellow")}
          />
          <rect
            x="54"
            y="62"
            width="12"
            height="6"
            rx="3"
            style={{ fill: "var(--surface)" }}
          />
        </>
      )}
    />
  ),

  // ── Routines ──
  "routine.bed": () => (
    <Art
      draw={({ f }) => (
        <>
          <rect
            x="16"
            y="40"
            width="10"
            height="56"
            rx="4"
            fill={f("lavender")}
          />
          <rect
            x="94"
            y="56"
            width="10"
            height="40"
            rx="4"
            fill={f("lavender")}
          />
          <rect
            x="22"
            y="62"
            width="78"
            height="24"
            rx="8"
            style={{ fill: "var(--surface)" }}
          />
          <rect
            x="28"
            y="52"
            width="24"
            height="16"
            rx="8"
            style={{
              fill: "var(--surface)",
              stroke: "var(--surface-edge)",
              strokeWidth: 2,
            }}
          />
          <rect x="48" y="58" width="52" height="28" rx="8" fill={f("blue")} />
        </>
      )}
    />
  ),
  "routine.toothbrush": () => (
    <Art
      draw={({ f }) => (
        <g transform="rotate(-30 60 60)">
          <rect x="18" y="60" width="72" height="12" rx="6" fill={f("mint")} />
          <rect
            x="74"
            y="44"
            width="26"
            height="16"
            rx="4"
            style={{
              fill: "var(--surface)",
              stroke: "var(--surface-edge)",
              strokeWidth: 2,
            }}
          />
          <path
            d="M78 44v-6M84 44v-6M90 44v-6M96 44v-6"
            style={{ stroke: "var(--surface-edge)", strokeWidth: 3 }}
          />
          <path d="M76 36q12-10 22 0" fill={f("blue")} />
        </g>
      )}
    />
  ),
  "routine.soap": () => (
    <Art
      draw={({ f }) => (
        <>
          <rect
            x="24"
            y="56"
            width="64"
            height="36"
            rx="14"
            fill={f("lavender")}
          />
          <circle
            cx="82"
            cy="40"
            r="12"
            style={{
              fill: "var(--blue-50)",
              stroke: "var(--blue)",
              strokeWidth: 2,
            }}
          />
          <circle
            cx="98"
            cy="58"
            r="8"
            style={{
              fill: "var(--blue-50)",
              stroke: "var(--blue)",
              strokeWidth: 2,
            }}
          />
          <circle
            cx="62"
            cy="34"
            r="7"
            style={{
              fill: "var(--blue-50)",
              stroke: "var(--blue)",
              strokeWidth: 2,
            }}
          />
        </>
      )}
    />
  ),
  "routine.bowl": () => (
    <Art
      draw={({ f }) => (
        <>
          <ellipse
            cx="60"
            cy="54"
            rx="38"
            ry="12"
            style={{
              fill: "var(--surface)",
              stroke: "var(--surface-edge)",
              strokeWidth: 2,
            }}
          />
          <path d="M22 56q4 38 38 38t38-38z" fill={f("coral")} />
          <path
            d="M70 20l-8 34M82 22l-14 32"
            style={{
              stroke: "var(--content-brown)",
              strokeWidth: 3,
              strokeLinecap: "round",
            }}
          />
        </>
      )}
    />
  ),

  // ── Badges ──
  "badge.explorer-star": () => (
    <Art
      shadow={false}
      draw={({ f }) =>
        medal(
          <path
            d="M60 48l6 13 14 2-10 10 2 14-12-7-12 7 2-14-10-10 14-2z"
            fill={f("coral")}
          />,
          "blue",
          f,
        )
      }
    />
  ),
  "badge.curious-mind": () => (
    <Art
      shadow={false}
      draw={({ f }) =>
        medal(
          <>
            <circle
              cx="56"
              cy="64"
              r="11"
              style={{
                fill: "var(--surface)",
                stroke: "var(--lavender-strong)",
                strokeWidth: 4,
              }}
            />
            <path
              d="M64 72l10 10"
              style={{
                stroke: "var(--lavender-strong)",
                strokeWidth: 5,
                strokeLinecap: "round",
              }}
            />
          </>,
          "lavender",
          f,
        )
      }
    />
  ),
  "badge.little-reader": () => (
    <Art
      shadow={false}
      draw={({ f }) =>
        medal(
          <>
            <path d="M40 58q10-4 20 2v22q-10-6-20-2z" fill={f("mint")} />
            <path d="M80 58q-10-4-20 2v22q10-6 20-2z" fill={f("mint")} />
          </>,
          "mint",
          f,
        )
      }
    />
  ),
  "badge.number-finder": () => (
    <Art
      shadow={false}
      draw={({ f }) =>
        medal(
          <text
            x="60"
            y="78"
            textAnchor="middle"
            fontSize="28"
            fontWeight="800"
            style={{ fill: "var(--blue-strong)" }}
          >
            123
          </text>,
          "coral",
          f,
        )
      }
    />
  ),
  "badge.memory-master": () => (
    <Art
      shadow={false}
      draw={({ f }) =>
        medal(
          <>
            {[0, 1, 2, 3, 4].map((i) => (
              <circle
                key={i}
                cx={
                  60 +
                  Math.round(10 * Math.cos((i * 2 * Math.PI) / 5) * 100) / 100
                }
                cy={
                  68 +
                  Math.round(10 * Math.sin((i * 2 * Math.PI) / 5) * 100) / 100
                }
                r="7"
                fill={f("coral")}
              />
            ))}
            <circle cx="60" cy="68" r="5" style={{ fill: "var(--yellow)" }} />
          </>,
          "lavender",
          f,
        )
      }
    />
  ),
  "badge.brave-challenger": () => (
    <Art
      shadow={false}
      draw={({ f }) =>
        medal(
          <>
            <path d="M48 52h24v8q0 12-12 14q-12-2-12-14z" fill={f("coral")} />
            <rect
              x="52"
              y="78"
              width="16"
              height="6"
              rx="3"
              fill={f("coral")}
            />
          </>,
          "blue",
          f,
        )
      }
    />
  ),
} satisfies Record<string, () => ReactNode>;
