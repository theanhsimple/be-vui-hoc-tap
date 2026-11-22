"use client";

import {
  type TargetAndTransition,
  motion,
  useReducedMotion,
} from "motion/react";
import { useId } from "react";

import { EASE } from "@/design-system/motion/presets";

export type MascotState = "idle" | "talk" | "cheer" | "think" | "encourage";
export const MASCOT_STATES: readonly MascotState[] = [
  "idle",
  "talk",
  "cheer",
  "think",
  "encourage",
];

export interface LittleMascotProps {
  state?: MascotState;
  size?: number;
  className?: string;
  /** Accessible description; omit when decorative (the usual case). */
  label?: string;
}

/**
 * Motion is event-driven only: idle is still, "cheer" hops once, "encourage"
 * nods once, "talk" moves the mouth only while speaking. No constant motion.
 */
const BODY: Record<MascotState, TargetAndTransition> = {
  idle: { y: 0, rotate: 0 },
  talk: { y: 0, rotate: 0 },
  cheer: { y: [0, -10, 0], transition: { duration: 0.5, ease: EASE.out } },
  think: { rotate: -5, transition: { duration: 0.3, ease: EASE.out } },
  encourage: {
    rotate: [0, 4, -4, 0],
    transition: { duration: 0.7, ease: "easeInOut" },
  },
};

/**
 * PLACEHOLDER mascot (a friendly sun, from the prototype's "Bạn Nắng").
 * Final 3D-rendered art replaces this drawing; the `state` API stays.
 */
export function LittleMascot({
  state = "idle",
  size = 112,
  className,
  label,
}: LittleMascotProps) {
  const reduce = useReducedMotion();
  const id = useId().replace(/:/g, "");

  return (
    <motion.svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-placeholder="true"
      key={reduce ? "still" : state}
      animate={
        reduce ? { y: 0, rotate: state === "think" ? -5 : 0 } : BODY[state]
      }
      style={{ originX: "50%", originY: "60%", overflow: "visible" }}
    >
      <defs>
        <radialGradient id={`${id}-b`} cx="38%" cy="30%" r="72%">
          <stop offset="0%" style={{ stopColor: "var(--yellow-50)" }} />
          <stop offset="55%" style={{ stopColor: "var(--yellow)" }} />
          <stop offset="100%" style={{ stopColor: "var(--yellow-edge)" }} />
        </radialGradient>
      </defs>
      <ellipse
        cx="60"
        cy="113"
        rx="26"
        ry="4"
        style={{ fill: "var(--ink)" }}
        opacity="0.1"
      />
      {Array.from({ length: 10 }, (_, i) => (
        <rect
          key={i}
          x="55"
          y="6"
          width="10"
          height="15"
          rx="5"
          style={{ fill: "var(--yellow)" }}
          transform={`rotate(${i * 36} 60 58)`}
        />
      ))}
      <circle cx="60" cy="58" r="37" fill={`url(#${id}-b)`} />
      <ellipse cx="46" cy="40" rx="11" ry="7" fill="#fff" opacity="0.45" />
      <circle
        cx="39"
        cy="66"
        r="6"
        style={{ fill: "var(--coral)" }}
        opacity="0.45"
      />
      <circle
        cx="81"
        cy="66"
        r="6"
        style={{ fill: "var(--coral)" }}
        opacity="0.45"
      />
      <Face state={state} animateMouth={!reduce} />
    </motion.svg>
  );
}

function Face({
  state,
  animateMouth,
}: {
  state: MascotState;
  animateMouth: boolean;
}) {
  const ink = {
    stroke: "var(--ink)",
    fill: "none",
    strokeWidth: 4,
    strokeLinecap: "round",
  } as const;
  const dot = { fill: "var(--ink)" } as const;

  const eyes =
    state === "cheer" ? (
      <>
        <path d="M40 55q6-7 12 0" style={ink} />
        <path d="M68 55q6-7 12 0" style={ink} />
      </>
    ) : (
      <>
        <circle
          cx={state === "think" ? 48 : 46}
          cy={state === "think" ? 50 : 54}
          r="4.5"
          style={dot}
        />
        <circle
          cx={state === "think" ? 76 : 74}
          cy={state === "think" ? 50 : 54}
          r="4.5"
          style={dot}
        />
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
          style={{ fill: "var(--ink)", originX: "60px", originY: "73px" }}
          animate={animateMouth ? { scaleY: [1, 0.4, 1, 0.7, 1] } : undefined}
          transition={{ duration: 0.9, repeat: Infinity }}
        />
      );
      break;
    case "cheer":
      mouth = <path d="M47 68q13 15 26 0z" style={{ fill: "var(--ink)" }} />;
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
      {mouth}
    </g>
  );
}
