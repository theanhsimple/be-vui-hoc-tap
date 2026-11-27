"use client";

import { ArrowRight, Heart, House } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { submitPlacementAction } from "@/features/learning/backend/actions";
import type { PlacementRun } from "@/features/learning/backend/student";
import type {
  LearningQuestion,
  QuestionResponse,
} from "@/features/learning/types";
import { useAudio } from "@/lib/audio";

import { AudioInstruction } from "../../learning/AudioInstruction";
import { FeedbackPanel } from "../../learning/FeedbackPanel";
import { LearningProgress } from "../../learning/LearningProgress";
import { LittleMascot } from "../../learning/LittleMascot";
import { QuestionCard } from "../../learning/QuestionCard";
import { ParentGate } from "../../navigation/ParentGate";
import { LittleButton } from "../../ui/LittleButton";
import { LittleCard } from "../../ui/LittleCard";
import { ActivityRenderer } from "../activities/ActivityRenderer";
import { StudentScreen } from "../StudentScreen";
import { VisualView } from "../VisualView";
import { MemorizeStage } from "../lessons/MemorizeStage";

/** Errors after which the page reloads the run from the server. */
const STALE = new Set(["question_mismatch", "run_not_active", "forbidden"]);

const THANKS = [
  "Cảm ơn con! Mình xem câu tiếp theo nhé.",
  "Con làm chăm chú lắm! Đi tiếp nào.",
  "Tuyệt! Cùng chơi câu tiếp theo nhé.",
];

const NONE: readonly string[] = [];

type Phase = "memorize" | "answering" | "sending" | "thanks" | "done";

/**
 * Placement activity player (PRD P4). One try per item and the SAME warm
 * message whatever the answer: it is an observation, not a test. Answers are
 * recorded by the server; the child never sees right/wrong here.
 */
export function PlacementPlayer({
  run,
  questions,
  childId,
}: {
  run: PlacementRun;
  questions: readonly LearningQuestion[];
  childId: string;
}) {
  const router = useRouter();
  const { play, playSfx } = useAudio();
  const [index, setIndex] = useState(run.currentIndex);
  const question = questions[index];
  const [phase, setPhase] = useState<Phase>(
    question?.memorize ? "memorize" : "answering",
  );
  const [error, setError] = useState<string | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const pendingKey = useRef<string | null>(null);
  const thanks = THANKS[index % THANKS.length]!;

  useEffect(() => {
    if (phase !== "done") return;
    playSfx("reward");
    void play({ text: "Con giỏi lắm! Mình đã chơi xong rồi.", lang: "vi-VN" });
  }, [phase, play, playSfx]);

  const submit = useCallback(
    async (response: QuestionResponse) => {
      if (!question || phase !== "answering") return;
      setPhase("sending");
      setError(null);
      pendingKey.current ??= crypto.randomUUID();
      try {
        const r = await submitPlacementAction({
          runId: run.runId,
          questionId: question.id,
          response,
          idempotencyKey: pendingKey.current,
        });
        if (!r.ok) {
          if (STALE.has(r.code)) {
            router.refresh();
            return;
          }
          if (r.code === "invalid_response") pendingKey.current = null;
          setError("Mình chưa gửi được câu trả lời. Con thử lại nhé.");
          setPhase("answering");
          return;
        }
        pendingKey.current = null;
        playSfx("tap");
        if (r.nextAction === "complete") {
          setPhase("done");
          return;
        }
        setPhase("thanks");
        void play({ text: thanks, lang: "vi-VN" });
      } catch {
        // Network failure: keep the key so a retry cannot double-record.
        setError("Mình chưa gửi được câu trả lời. Con thử lại nhé.");
        setPhase("answering");
      }
    },
    [question, phase, run.runId, router, play, playSfx, thanks],
  );

  const next = () => {
    const nextIndex = index + 1;
    setIndex(nextIndex);
    setPhase(questions[nextIndex]?.memorize ? "memorize" : "answering");
  };

  const memorizeDone = useCallback(() => setPhase("answering"), []);

  if (phase === "done" || !question) {
    return (
      <StudentScreen align="center">
        <LittleCard
          padding="lg"
          className="mx-auto flex w-full max-w-xl flex-col items-center gap-5 text-center"
        >
          <span className="w-40">
            <LittleMascot state="cheer" />
          </span>
          <h1 className="text-display">Con giỏi lắm!</h1>
          <p className="text-body-lg">
            Mình đã chơi xong rồi. Con đưa máy cho bố mẹ xem nhé!
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <LittleButton
              size="xl"
              iconStart={<Heart />}
              onClick={() => setGateOpen(true)}
            >
              Đưa máy cho bố mẹ
            </LittleButton>
            <LittleButton
              size="xl"
              variant="secondary"
              iconStart={<House />}
              onClick={() => router.push("/student/home")}
            >
              Về nhà
            </LittleButton>
          </div>
        </LittleCard>
        <ParentGate
          open={gateOpen}
          onCancel={() => setGateOpen(false)}
          onPass={() => {
            setGateOpen(false);
            router.push(`/parent/children/${childId}?saved=discover`);
          }}
        />
      </StudentScreen>
    );
  }

  return (
    <StudentScreen
      align="start"
      center={
        <div className="flex min-w-0 flex-col items-center gap-1">
          <p className="text-body-sm font-bold text-ink-muted">Cùng khám phá</p>
          <LearningProgress
            total={questions.length}
            current={phase === "thanks" ? index + 1 : index}
          />
        </div>
      }
    >
      {phase === "memorize" && question.memorize ? (
        <MemorizeStage
          visuals={question.memorize.visuals}
          seconds={question.memorize.seconds}
          onDone={memorizeDone}
        />
      ) : (
        <QuestionCard
          key={question.id}
          layout={question.stimulus ? "split" : "stack"}
          instruction={
            <AudioInstruction
              key={question.id}
              text={question.prompt}
              source={
                question.instructionAudioUrl
                  ? { src: question.instructionAudioUrl, text: question.prompt }
                  : undefined
              }
              demo={!question.instructionAudioUrl}
              autoPlay
            />
          }
          stimulus={
            question.stimulus ? (
              <span className="block w-[clamp(140px,26vw,260px)] rounded-xl bg-surface p-4 shadow-sm">
                <VisualView
                  visual={question.stimulus}
                  label="Hình câu hỏi"
                  priority
                />
              </span>
            ) : undefined
          }
          feedback={
            phase === "thanks" ? (
              <FeedbackPanel
                kind="reveal"
                message={thanks}
                action={
                  <LittleButton
                    size="xl"
                    iconEnd={<ArrowRight strokeWidth={3} />}
                    onClick={next}
                  >
                    Tiếp tục
                  </LittleButton>
                }
              />
            ) : error ? (
              <p
                role="alert"
                className="rounded-md bg-warning-50 p-3 text-body font-semibold text-warning-strong"
              >
                {error}
              </p>
            ) : undefined
          }
        >
          <ActivityRenderer
            key={question.id}
            question={question}
            status="editing"
            attempt={1}
            locked={phase !== "answering"}
            eliminated={NONE}
            onSubmit={submit}
          />
        </QuestionCard>
      )}
    </StudentScreen>
  );
}
