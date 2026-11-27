"use client";

import { Clock, LayoutDashboard } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  isActivityRoute,
  isBreakDue,
  parseStint,
  type Stint,
  touchStint,
} from "@/features/learning/break-timer";
import { useAudio } from "@/lib/audio";

import { LittleMascot } from "../../learning/LittleMascot";
import { ParentGate } from "../../navigation/ParentGate";
import { LittleButton } from "../../ui/LittleButton";
import { LittleModal } from "../../ui/LittleModal";

const KEY = "little.break";
const TICK_MS = 15_000;

function read(): Stint | null {
  try {
    return parseStint(sessionStorage.getItem(KEY));
  } catch {
    return null;
  }
}
function write(s: Stint) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Storage blocked: the reminder then counts from this page only.
  }
}

/**
 * Gentle break reminder after the parent's time limit (PRD S10). It never
 * interrupts a question: during a lesson it waits for the next screen. Only
 * an adult (parent gate) can continue the session.
 */
export function BreakReminder({
  childId,
  minutes,
}: {
  childId: string;
  minutes: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { play } = useAudio();
  const [due, setDue] = useState(false);
  const [gate, setGate] = useState(false);
  const [adult, setAdult] = useState(false);
  const stint = useRef<Stint | null>(null);
  const spoken = useRef(false);
  const waiting = isActivityRoute(pathname);

  useEffect(() => {
    const tick = () => {
      const s = touchStint(stint.current ?? read(), childId, Date.now());
      stint.current = s;
      write(s);
      setDue(isBreakDue(s, minutes, Date.now()));
    };
    tick();
    const id = setInterval(tick, TICK_MS);
    return () => clearInterval(id);
  }, [childId, minutes]);

  const open = due && !waiting;
  useEffect(() => {
    if (!open || spoken.current) return;
    spoken.current = true;
    void play({
      text: "Mình học chăm quá rồi! Nghỉ mắt một chút nhé.",
      lang: "vi-VN",
    });
  }, [open, play]);

  const more = () => {
    const now = Date.now();
    const s: Stint = { childId, startedAt: now, lastSeenAt: now };
    stint.current = s;
    write(s);
    spoken.current = false;
    setAdult(false);
    setDue(false);
  };

  return (
    <>
      <LittleModal
        open={open && !gate}
        // Closing (× or Esc) is for adults too: it goes through the gate.
        onClose={() => (adult ? more() : setGate(true))}
        dismissible={false}
        eyebrow={
          <span className="inline-flex items-center gap-1.5">
            <Clock aria-hidden className="size-4" /> Đến giờ nghỉ
          </span>
        }
        title="Mình nghỉ mắt một chút nhé!"
        description={
          adult
            ? `Bố mẹ có thể cho bé học thêm ${minutes} phút, hoặc về khu vực phụ huynh.`
            : "Con đã học rất chăm. Đứng dậy vươn vai, uống nước rồi gọi bố mẹ nhé."
        }
        footer={
          adult ? (
            <>
              <LittleButton
                variant="secondary"
                iconStart={<LayoutDashboard />}
                onClick={() => router.push("/parent")}
              >
                Về khu vực phụ huynh
              </LittleButton>
              <LittleButton onClick={more}>
                Học thêm {minutes} phút
              </LittleButton>
            </>
          ) : (
            <LittleButton
              size="lg"
              variant="secondary"
              onClick={() => setGate(true)}
            >
              Dành cho bố mẹ
            </LittleButton>
          )
        }
      >
        <div className="flex justify-center">
          <span className="w-32">
            <LittleMascot state={adult ? "idle" : "encourage"} />
          </span>
        </div>
      </LittleModal>
      <ParentGate
        open={gate}
        onCancel={() => setGate(false)}
        onPass={() => {
          setGate(false);
          setAdult(true);
        }}
      />
    </>
  );
}
