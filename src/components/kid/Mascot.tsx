"use client";

import {
  type TargetAndTransition,
  motion,
  useReducedMotion,
} from "motion/react";
import { useId } from "react";

export type MascotState = "idle" | "talk" | "cheer" | "think" | "encourage";

export const MASCOT_STATES: readonly MascotState[] = [
  "idle",
  "talk",
  "cheer",
  "think",
  "encourage",
];

export interface MascotProps {
  state?: MascotState;
  /** Rendered width/height in px. */
  size?: number;
  className?: string;
  /** Accessible description; omit when the mascot is purely decorative. */
  label?: string;
}

const BODY_MOTION: Record<MascotState, TargetAndTransition> = {
  idle: {
    y: [0, -4, 0],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
  },
  talk: {
    y: [0, -3, 0],
    transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" },
  },
  cheer: {
    y: [0, -18, 0],
    scale: [1, 1.06, 1],
    transition: { duration: 0.6, repeat: 2, ease: "easeOut" },
  },
  think: {
    rotate: -6,
    y: 0,
    transition: { type: "spring", stiffness: 120, damping: 14 },
  },
  encourage: {
    rotate: [0, 5, 0, -5, 0],
    transition: { duration: 1.4, repeat: 1, ease: "easeInOut" },
  },
};

/**
 * Placeholder for little's guide mascot — a friendly sun, redrawn from the
 * prototype's "Bạn Nắng". Final 3D-rendered art replaces this SVG later;
 * the `state` API stays the same.
 */
export function Mascot({
  state = "idle",
  size = 120,
  className,
  label,
}: MascotProps) {
  const reduce = useReducedMotion();
  const id = useId();
  const bodyGrad = `${id}-body`;
  const shine = `${id}-shine`;

  return (
    <motion.svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      animate={
        reduce
          ? { y: 0, rotate: state === "think" ? -6 : 0 }
          : BODY_MOTION[state]
      }
      key={reduce ? "static" : state}
      style={{ originX: "50%", originY: "50%", overflow: "visible" }}
    >
      <defs>
        <radialGradient id={bodyGrad} cx="38%" cy="32%" r="70%">
          <stop offset="0%" style={{ stopColor: "var(--butter-300)" }} />
          <stop offset="70%" style={{ stopColor: "var(--butter-400)" }} />
          <stop offset="100%" style={{ stopColor: "var(--butter-600)" }} />
        </radialGradient>
        <radialGradient id={shine} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* contact shadow */}
      <ellipse
        cx="60"
        cy="114"
        rx="28"
        ry="4"
        fill="var(--ink-900)"
        opacity="0.12"
      />

      {/* rays */}
      <motion.g
        animate={reduce ? undefined : { rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        style={{ originX: "60px", originY: "58px" }}
      >
        {Array.from({ length: 10 }, (_, i) => (
          <rect
            key={i}
            x="55"
            y="4"
            width="10"
            height="16"
            rx="5"
            style={{ fill: "var(--butter-400)" }}
            transform={`rotate(${i * 36} 60 58)`}
          />
        ))}
      </motion.g>

      {/* body */}
      <circle cx="60" cy="58" r="38" fill={`url(#${bodyGrad})`} />
      <ellipse cx="46" cy="40" rx="12" ry="8" fill={`url(#${shine})`} />

      {/* cheeks */}
      <circle
        cx="38"
        cy="66"
        r="6"
        style={{ fill: "var(--rose-300)" }}
        opacity="0.9"
      />
      <circle
        cx="82"
        cy="66"
        r="6"
        style={{ fill: "var(--rose-300)" }}
        opacity="0.9"
      />

      <Face state={state} reduce={!!reduce} />
    </motion.svg>
  );
}

function Face({ state, reduce }: { state: MascotState; reduce: boolean }) {
  const ink = {
    stroke: "var(--ink-900)",
    fill: "none",
    strokeWidth: 4,
    strokeLinecap: "round",
  } as const;
  const dot = { fill: "var(--ink-900)" } as const;

  const eyes =
    state === "cheer" ? (
      <>
        <path d="M40 54q6-7 12 0" style={ink} />
        <path d="M68 54q6-7 12 0" style={ink} />
      </>
    ) : state === "think" ? (
      <>
        <circle cx="48" cy="50" r="4.5" style={dot} />
        <circle cx="74" cy="50" r="4.5" style={dot} />
      </>
    ) : (
      <>
        <circle cx="46" cy="54" r="5" style={dot} />
        <circle cx="74" cy="54" r="5" style={dot} />
        <circle cx="47.5" cy="52.5" r="1.6" fill="#fff" />
        <circle cx="75.5" cy="52.5" r="1.6" fill="#fff" />
      </>
    );

  let mouth;
  switch (state) {
    case "talk":
      mouth = (
        <motion.ellipse
          cx="60"
          cy="73"
          rx="7"
          ry="5"
          style={{ fill: "var(--ink-900)", originX: "60px", originY: "73px" }}
          animate={reduce ? undefined : { scaleY: [1, 0.35, 1, 0.6, 1] }}
          transition={{ duration: 0.9, repeat: Infinity }}
        />
      );
      break;
    case "cheer":
      mouth = (
        <path d="M47 68q13 16 26 0z" style={{ fill: "var(--ink-900)" }} />
      );
      break;
    case "think":
      mouth = <circle cx="64" cy="74" r="3.5" style={dot} />;
      break;
    case "encourage":
      mouth = <path d="M50 70q10 8 20 0" style={ink} />;
      break;
    default:
      mouth = <path d="M49 69q11 10 22 0" style={ink} />;
  }

  return (
    <g>
      {eyes}
      {state === "encourage" && (
        <>
          <path d="M40 44l10-3" style={{ ...ink, strokeWidth: 3 }} />
          <path d="M80 44l-10-3" style={{ ...ink, strokeWidth: 3 }} />
        </>
      )}
      {mouth}
    </g>
  );
}
