"use client";

import { ArrowRight, Lightbulb, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";

import type { SessionState } from "@/features/learning/backend/overview";
import { useLearningRuntime } from "@/features/learning/runtime";
import {
  createPlayerReducer,
  initPlayer,
} from "@/features/learning/session/reducer";
import type {
  Lesson,
  QuestionResponse,
  World,
} from "@/features/learning/types";
import { useAudio } from "@/lib/audio";

import { AudioInstruction } from "../../learning/AudioInstruction";
import { FeedbackPanel } from "../../learning/FeedbackPanel";
import { LearningProgress } from "../../learning/LearningProgress";
import { QuestionCard } from "../../learning/QuestionCard";
import type { ActivityStatus } from "../../learning/types";
import { LittleButton } from "../../ui/LittleButton";
import { LittleIconButton } from "../../ui/LittleIconButton";
import { LittleModal } from "../../ui/LittleModal";
import { ActivityRenderer } from "../activities/ActivityRenderer";
import { StudentScreen } from "../StudentScreen";
import { VisualView } from "../VisualView";
import { MemorizeStage } from "./MemorizeStage";

export interface LessonPlayerProps {
  lesson: Lesson;
  world: World;
  /** The open server session (started on the lesson intro screen). */
  session: SessionState;
}

/** Errors after which the page must reload its session from the server. */
const STALE = new Set(["question_mismatch", "session_not_active", "forbidden"]);

/**
 * Screen 07 — reusable activity player for every question type.
 * Every answer is graded and recorded by the server; the player only keeps
 * UI state. Progress therefore survives refreshes and other devices.
 */
export function LessonPlayer({ lesson, world, session }: LessonPlayerProps) {
  const router = useRouter();
  const runtime = useLearningRuntime();
  const { play, playSfx } = useAudio();
  const reducer = useMemo(
    () => createPlayerReducer(lesson.questions),
    [lesson.questions],
  );
  const [state, dispatch] = useReducer(
    reducer,
    {
      index: session.currentIndex,
      results: session.results,
      attempt: session.attempt,
    },
    (r) => initPlayer(lesson.questions, r),
  );
  const [exitOpen, setExitOpen] = useState(false);
  const inFlight = useRef(false);
  // One idempotency key per try: a retried request (e.g. flaky network)
  // reuses it, so the server records the answer at most once.
  const pendingKey = useRef<string | null>(null);
  const question = lesson.questions[state.index];

  // Lesson finished: the server has already completed the session.
  useEffect(() => {
    if (state.phase !== "complete") return;
    router.replace(
      `/student/lessons/${lesson.id}/result?session=${session.sessionId}`,
    );
  }, [state.phase, lesson.id, session.sessionId, router]);

  const submit = useCallback(
    async (response: QuestionResponse) => {
      if (!question || state.phase !== "answering" || inFlight.current) return;
      inFlight.current = true;
      pendingKey.current ??= crypto.randomUUID();
      dispatch({ type: "SUBMIT" });
      try {
        const result = await runtime.submitAnswer({
          sessionId: session.sessionId,
          questionId: question.id,
          response,
          idempotencyKey: pendingKey.current,
        });
        if (!result.ok) {
          if (STALE.has(result.code)) {
            router.replace(`/student/lessons/${lesson.id}`);
            return;
          }
          // Invalid answers are a client bug: drop the key and let the child retry.
          if (result.code === "invalid_response") pendingKey.current = null;
          dispatch({ type: "GRADE_FAILED" });
          return;
        }
        pendingKey.current = null;
        dispatch({ type: "GRADED", result });
        playSfx(result.correct ? "correct" : "tryAgain");
        void play({ text: result.message, lang: "vi-VN" });
      } catch {
        // Network failure: keep the key so a retry cannot double-record.
        dispatch({ type: "GRADE_FAILED" });
      } finally {
        inFlight.current = false;
      }
    },
    [
      question,
      state.phase,
      session.sessionId,
      lesson.id,
      router,
      runtime,
      play,
      playSfx,
    ],
  );

  const hint = async () => {
    if (!question || state.hintUsed) return;
    try {
      const h = await runtime.requestHint({
        sessionId: session.sessionId,
        questionId: question.id,
      });
      if (!h.ok) return;
      dispatch({
        type: "HINT",
        text: h.text,
        eliminateOptionId: h.eliminateOptionId,
      });
      void play({ text: h.text, lang: "vi-VN" });
    } catch {
      // A missing hint is not worth interrupting the child for.
    }
  };

  const memorizeDone = useCallback(
    () => dispatch({ type: "MEMORIZE_DONE" }),
    [],
  );

  const status: ActivityStatus =
    state.phase === "feedback"
      ? state.feedback?.kind === "success"
        ? "correct"
        : "reveal"
      : state.feedback?.kind === "tryAgain"
        ? "tryAgain"
        : "editing";
  const isLast = state.index + 1 >= state.total;

  return (
    <StudentScreen
      align="start"
      start={
        <LittleIconButton
          label="Dừng lại"
          icon={<X strokeWidth={3} />}
          size="xl"
          onClick={() => setExitOpen(true)}
        />
      }
      center={
        <div className="flex min-w-0 flex-col items-center gap-1">
          <p className="max-w-full truncate text-body-sm font-bold text-ink-muted">
            {lesson.title}
          </p>
          <LearningProgress
            total={state.total}
            current={state.phase === "feedback" ? state.index + 1 : state.index}
          />
          <p className="text-caption text-ink-muted" aria-live="polite">
            Câu {Math.min(state.index + 1, state.total)}/{state.total}
          </p>
        </div>
      }
    >
      {question && state.phase === "memorize" && question.memorize ? (
        <MemorizeStage
          visuals={question.memorize.visuals}
          seconds={question.memorize.seconds}
          onDone={memorizeDone}
        />
      ) : question ? (
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
            state.phase === "feedback" && state.feedback ? (
              <FeedbackPanel
                kind={state.feedback.kind}
                message={state.feedback.message}
                action={
                  <LittleButton
                    size="xl"
                    variant={
                      state.feedback.kind === "success" ? "success" : "primary"
                    }
                    iconEnd={<ArrowRight strokeWidth={3} />}
                    onClick={() => dispatch({ type: "NEXT" })}
                  >
                    {isLast ? "Xem kết quả" : "Tiếp tục"}
                  </LittleButton>
                }
              />
            ) : state.feedback?.kind === "tryAgain" ? (
              <FeedbackPanel kind="tryAgain" message={state.feedback.message} />
            ) : state.error ? (
              <p
                role="alert"
                className="rounded-md bg-warning-50 p-3 text-body font-semibold text-warning-strong"
              >
                {state.error}
              </p>
            ) : undefined
          }
        >
          <div className="flex w-full flex-col items-center gap-4">
            <ActivityRenderer
              key={question.id}
              question={question}
              status={status}
              attempt={state.attempt}
              locked={state.phase !== "answering"}
              reveal={state.reveal}
              eliminated={state.eliminated}
              onSubmit={submit}
            />
            {state.phase === "answering" && question.type !== "memory" && (
              <div className="flex flex-wrap items-center justify-center gap-3">
                {state.hint ? (
                  <p className="flex items-center gap-2 rounded-md bg-yellow-50 px-4 py-2 text-body-lg font-semibold">
                    <Lightbulb
                      aria-hidden
                      className="size-5 text-yellow-strong"
                    />{" "}
                    {state.hint}
                  </p>
                ) : (
                  <LittleButton
                    variant="reward"
                    size="lg"
                    iconStart={<Lightbulb />}
                    onClick={hint}
                  >
                    Gợi ý
                  </LittleButton>
                )}
              </div>
            )}
          </div>
        </QuestionCard>
      ) : null}

      <LittleModal
        open={exitOpen}
        onClose={() => setExitOpen(false)}
        title="Con muốn dừng lại không?"
        description="Bài học được giữ lại. Lần sau con học tiếp từ câu này nhé."
        footer={
          <>
            <LittleButton
              variant="secondary"
              size="lg"
              onClick={() => router.push(`/student/worlds/${world.id}`)}
            >
              Dừng lại
            </LittleButton>
            <LittleButton size="lg" onClick={() => setExitOpen(false)}>
              Học tiếp
            </LittleButton>
          </>
        }
      />
    </StudentScreen>
  );
}
