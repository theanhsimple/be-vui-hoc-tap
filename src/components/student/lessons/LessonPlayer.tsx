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

import { requestHint, submitAnswer } from "@/features/learning/grading/actions";
import { recordLessonCompletion } from "@/features/learning/progress/calc";
import type { QuestionResult } from "@/features/learning/progress/model";
import {
  createPlayerReducer,
  initPlayer,
} from "@/features/learning/session/reducer";
import { demoStore } from "@/features/learning/store/demoStore";
import { useStudent } from "@/features/learning/store/hooks";
import type {
  Catalog,
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
  catalog: Catalog;
  lesson: Lesson;
  world: World;
}

/** Screen 07 — reusable activity player for every question type. */
export function LessonPlayer(props: LessonPlayerProps) {
  const ctx = useStudent();
  const backHref = `/student/worlds/${props.world.id}`;
  if (!ctx)
    return (
      <StudentScreen loading backHref={backHref}>
        {null}
      </StudentScreen>
    );
  const saved = ctx.progress.inProgress;
  const resume =
    saved?.lessonId === props.lesson.id
      ? {
          index: saved.questionIndex,
          results: saved.results,
          attempt: saved.attempt,
        }
      : undefined;
  return (
    <PlayerSession
      key={props.lesson.id}
      {...props}
      childId={ctx.child.id}
      resume={resume}
      startedAt={saved?.startedAt}
    />
  );
}

function PlayerSession({
  catalog,
  lesson,
  world,
  childId,
  resume,
  startedAt,
}: LessonPlayerProps & {
  childId: string;
  resume?: { index: number; results: QuestionResult[]; attempt?: number };
  startedAt?: string;
}) {
  const router = useRouter();
  const { play, playSfx } = useAudio();
  const reducer = useMemo(
    () => createPlayerReducer(lesson.questions),
    [lesson.questions],
  );
  const [state, dispatch] = useReducer(reducer, resume, (r) =>
    initPlayer(lesson.questions, r),
  );
  const [exitOpen, setExitOpen] = useState(false);
  const inFlight = useRef(false);
  const finished = useRef(false);
  const sessionStart = useRef(startedAt ?? new Date().toISOString());
  const question = lesson.questions[state.index];

  // Save progress after every finished question and every try, so a refresh
  // or exit resumes on the same question with the same try count.
  useEffect(() => {
    if (
      state.phase === "complete" ||
      (state.results.length === 0 && state.attempt === 1)
    )
      return;
    const onCurrent = state.phase === "answering" || state.phase === "grading";
    demoStore.saveInProgress(childId, {
      lessonId: lesson.id,
      questionIndex: state.results.length,
      results: state.results,
      attempt: onCurrent ? state.attempt : undefined,
      startedAt: sessionStart.current,
    });
  }, [childId, lesson.id, state.results, state.phase, state.attempt]);

  // Lesson finished: record stars and rewards, then show the result.
  useEffect(() => {
    if (state.phase !== "complete" || finished.current) return;
    finished.current = true;
    const now = new Date();
    demoStore.updateProgress(
      childId,
      (p) =>
        recordLessonCompletion(catalog, p, lesson, state.results, now).progress,
    );
    router.replace(`/student/lessons/${lesson.id}/result`);
  }, [state.phase, state.results, catalog, childId, lesson, router]);

  const submit = useCallback(
    async (response: QuestionResponse) => {
      if (!question || state.phase !== "answering" || inFlight.current) return;
      inFlight.current = true;
      dispatch({ type: "SUBMIT" });
      try {
        const result = await submitAnswer({
          lessonId: lesson.id,
          questionId: question.id,
          attempt: state.attempt,
          response,
        });
        dispatch({ type: "GRADED", result });
        playSfx(result.correct ? "correct" : "tryAgain");
        void play({ text: result.message, lang: "vi-VN" });
      } catch {
        dispatch({ type: "GRADE_FAILED" });
      } finally {
        inFlight.current = false;
      }
    },
    [question, state.phase, state.attempt, lesson.id, play, playSfx],
  );

  const hint = async () => {
    if (!question || state.hintUsed) return;
    try {
      const h = await requestHint({
        lessonId: lesson.id,
        questionId: question.id,
      });
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
