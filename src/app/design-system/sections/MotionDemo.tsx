"use client";

import { Play } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import { LittleBadge } from "@/components/ui/LittleBadge";
import { LittleButton } from "@/components/ui/LittleButton";
import { LittleCard } from "@/components/ui/LittleCard";
import { LittleIllustration } from "@/components/ui/LittleIllustration";
import {
  MOTION_PRESETS,
  buttonPress,
  cardHover,
  fadeIn,
  fadeUp,
  gentleNudge,
  rewardItem,
  rewardReveal,
  scaleIn,
  successFeedback,
} from "@/design-system/motion/presets";

import { Demo, Section } from "./Section";

const BOX = "grid size-28 place-items-center rounded-lg bg-surface shadow-sm";

export function MotionDemo() {
  const reduce = useReducedMotion();
  const [run, setRun] = useState(0);
  return (
    <Section
      id="motion"
      title="Chuyển động"
      intro="Motion supports comprehension and feedback only. Respects prefers-reduced-motion: transforms are skipped, opacity changes stay."
    >
      <div className="flex flex-wrap items-center gap-3">
        <LittleBadge tone={reduce ? "warning" : "info"}>
          {reduce ? "Thiết bị đang bật giảm chuyển động" : "Chuyển động đầy đủ"}
        </LittleBadge>
        <LittleButton
          size="sm"
          iconStart={<Play />}
          onClick={() => setRun((r) => r + 1)}
        >
          Chạy lại tất cả
        </LittleButton>
      </div>
      <Demo title="Presets">
        <div className="grid grid-cols-2 gap-6 tablet:grid-cols-4">
          {[
            {
              name: "fadeIn",
              el: (
                <motion.div
                  key={`a${run}`}
                  className={BOX}
                  variants={fadeIn}
                  initial="hidden"
                  animate="visible"
                >
                  <Shape />
                </motion.div>
              ),
            },
            {
              name: "fadeUp",
              el: (
                <motion.div
                  key={`b${run}`}
                  className={BOX}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                >
                  <Shape />
                </motion.div>
              ),
            },
            {
              name: "scaleIn",
              el: (
                <motion.div
                  key={`c${run}`}
                  className={BOX}
                  variants={scaleIn}
                  initial="hidden"
                  animate="visible"
                >
                  <Shape />
                </motion.div>
              ),
            },
            {
              name: "successFeedback",
              el: (
                <motion.div
                  key={`d${run}`}
                  className={BOX}
                  variants={successFeedback}
                  initial="idle"
                  animate="success"
                >
                  <Shape />
                </motion.div>
              ),
            },
            {
              name: "gentleNudge",
              el: (
                <motion.div
                  key={`e${run}`}
                  className={BOX}
                  animate={{ x: gentleNudge.x }}
                  transition={gentleNudge.transition}
                >
                  <Shape />
                </motion.div>
              ),
            },
            {
              name: "rewardReveal",
              el: (
                <motion.div
                  key={`f${run}`}
                  className="flex gap-2"
                  variants={rewardReveal}
                  initial="hidden"
                  animate="visible"
                >
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      variants={rewardItem}
                      className="size-10"
                    >
                      <LittleIllustration name="shape.star" decorative />
                    </motion.span>
                  ))}
                </motion.div>
              ),
            },
            {
              name: "cardHover (hover me)",
              el: (
                <motion.div className={BOX} {...cardHover}>
                  <Shape />
                </motion.div>
              ),
            },
            {
              name: "buttonPress (press me)",
              el: (
                <motion.button
                  type="button"
                  aria-label="Thử nhấn"
                  className={BOX}
                  {...buttonPress}
                >
                  <Shape />
                </motion.button>
              ),
            },
          ].map((d) => (
            <figure key={d.name} className="flex flex-col items-center gap-2">
              <div className="grid h-32 place-items-center">{d.el}</div>
              <figcaption className="text-body-sm font-bold text-ink-muted">
                {d.name}
              </figcaption>
            </figure>
          ))}
        </div>
      </Demo>
      <LittleCard padding="none" className="overflow-x-auto">
        <table className="w-full text-left text-body-sm">
          <thead className="bg-surface-muted text-caption text-ink-muted uppercase">
            <tr>
              <th className="px-4 py-2">Preset</th>
              <th className="px-4 py-2">Duration</th>
              <th className="px-4 py-2">Use</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {MOTION_PRESETS.map((p) => (
              <tr key={p.name}>
                <td className="px-4 py-2 font-bold">{p.name}</td>
                <td className="px-4 py-2">{p.duration}</td>
                <td className="px-4 py-2 text-ink-muted">{p.use}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </LittleCard>
    </Section>
  );
}

function Shape() {
  return <LittleIllustration name="shape.circle" size={64} decorative />;
}
