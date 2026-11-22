"use client";

import { ArrowRight, RotateCcw } from "lucide-react";
import { useState } from "react";

import { AnswerOption } from "@/components/learning/AnswerOption";
import { AudioInstruction } from "@/components/learning/AudioInstruction";
import { AudioPlayer } from "@/components/learning/AudioPlayer";
import { FeedbackPanel } from "@/components/learning/FeedbackPanel";
import { ImageChoice } from "@/components/learning/ImageChoice";
import { LearningProgress } from "@/components/learning/LearningProgress";
import {
  LittleMascot,
  MASCOT_STATES,
} from "@/components/learning/LittleMascot";
import { MatchingGame } from "@/components/learning/MatchingGame";
import { type MemoryCard, MemoryGame } from "@/components/learning/MemoryGame";
import { PatternBuilder } from "@/components/learning/PatternBuilder";
import { QuestionCard } from "@/components/learning/QuestionCard";
import { RewardPanel } from "@/components/learning/RewardPanel";
import { SequenceBuilder } from "@/components/learning/SequenceBuilder";
import type {
  ActivityItem,
  ActivityStatus,
  AnswerState,
} from "@/components/learning/types";
import { LittleButton } from "@/components/ui/LittleButton";
import { LittleCard } from "@/components/ui/LittleCard";
import { LittleIllustration } from "@/components/ui/LittleIllustration";
import { useAudio } from "@/lib/audio";

import { Demo, Section } from "./Section";

const DEMO_NOTE = (
  <span className="block rounded-md bg-warning-50 px-3 py-2 text-body-sm font-semibold text-warning-strong">
    Demo: chấm điểm ngay trên trình duyệt. Bản thật chấm trên máy chủ, đáp án
    không gửi về máy của bé (D-004).
  </span>
);

const CIRCLE: ActivityItem = {
  id: "circle",
  label: "Hình tròn",
  illustration: "shape.circle",
};
const TRIANGLE: ActivityItem = {
  id: "triangle",
  label: "Hình tam giác",
  illustration: "shape.triangle",
};
const SQUARE: ActivityItem = {
  id: "square",
  label: "Hình vuông",
  illustration: "shape.square",
};
const STAR: ActivityItem = {
  id: "star",
  label: "Ngôi sao",
  illustration: "shape.star",
};

export function LearningDemo() {
  return (
    <Section
      id="learning"
      title="Thành phần học tập"
      intro="Components render content and report the child's response; they never contain answer keys. All activities are tap-based so they work with touch, mouse and keyboard."
    >
      <RepresentativeActivity />
      <MascotAndAnswers />
      <Activities />
      <FeedbackAndReward />
    </Section>
  );
}

// ── Representative activity ────────────────────────────────────────────────

const CHOICES = [CIRCLE, TRIANGLE, SQUARE];
const ANSWER = "circle"; // demo only — real grading is server-side
const MAX_TRIES = 2;

type Phase =
  | { kind: "answering" }
  | { kind: "tryAgain"; picked: string }
  | { kind: "correct" }
  | { kind: "reveal" }
  | { kind: "reward" };

function RepresentativeActivity() {
  const { playSfx, play } = useAudio();
  const [phase, setPhase] = useState<Phase>({ kind: "answering" });
  const [tries, setTries] = useState(0);

  const say = (text: string) => void play({ text, lang: "vi-VN" });

  const choose = (id: string) => {
    if (id === ANSWER) {
      playSfx("correct");
      say("Đúng rồi! Quả bóng tròn giống hình tròn.");
      setPhase({ kind: "correct" });
      return;
    }
    const n = tries + 1;
    setTries(n);
    playSfx("tryAgain");
    if (n >= MAX_TRIES) {
      say("Cùng xem nhé: hình tròn giống quả bóng.");
      setPhase({ kind: "reveal" });
    } else {
      say("Gần đúng rồi! Con nhìn kỹ quả bóng và thử lại nhé.");
      setPhase({ kind: "tryAgain", picked: id });
    }
  };

  const stateOf = (id: string): AnswerState => {
    switch (phase.kind) {
      case "correct":
        return id === ANSWER ? "correct" : "dimmed";
      case "reveal":
        return id === ANSWER ? "reveal" : "dimmed";
      case "tryAgain":
        return id === phase.picked ? "tryAgain" : "idle";
      default:
        return "idle";
    }
  };

  const reset = () => {
    setTries(0);
    setPhase({ kind: "answering" });
  };

  return (
    <Demo
      title="Hoạt động mẫu: chọn 1 trong 3 hình"
      note={
        <span className="flex flex-col gap-2">
          <span>
            Try a wrong answer (gentle correction), two wrong answers (the
            answer is shown), or the right one (success → reward). Audio is the
            browser voice, marked as a demo.
          </span>
          {DEMO_NOTE}
        </span>
      }
    >
      <div className="mb-3 flex justify-center">
        <LearningProgress total={5} current={phase.kind === "reward" ? 5 : 2} />
      </div>
      {phase.kind === "reward" ? (
        <RewardPanel
          title="Giỏi quá!"
          starsEarned={tries === 0 ? 3 : 2}
          sticker={{
            illustration: "reward.sticker-star",
            label: "Nhãn dán Ngôi sao",
          }}
          action={
            <LittleButton
              size="xl"
              variant="primary"
              iconStart={<RotateCcw />}
              onClick={reset}
            >
              Chơi lại
            </LittleButton>
          }
        />
      ) : (
        <QuestionCard
          layout="split"
          instruction={
            <AudioInstruction
              text="Quả bóng có hình gì? Con hãy chạm vào hình giống quả bóng nhé."
              demo
            />
          }
          stimulus={
            <LittleIllustration
              name="object.ball"
              alt="Quả bóng"
              className="w-[clamp(120px,24vw,220px)]"
              priority
            />
          }
          feedback={
            phase.kind === "correct" ? (
              <FeedbackPanel
                kind="success"
                message="Đúng rồi! Quả bóng tròn giống hình tròn."
                action={
                  <LittleButton
                    size="lg"
                    variant="success"
                    iconEnd={<ArrowRight />}
                    onClick={() => setPhase({ kind: "reward" })}
                  >
                    Tiếp tục
                  </LittleButton>
                }
              />
            ) : phase.kind === "tryAgain" ? (
              <FeedbackPanel
                kind="tryAgain"
                message="Gần đúng rồi! Con nhìn kỹ và thử lại nhé."
              />
            ) : phase.kind === "reveal" ? (
              <FeedbackPanel
                kind="reveal"
                message="Cùng xem nhé: hình tròn giống quả bóng."
                action={
                  <LittleButton
                    size="lg"
                    iconEnd={<ArrowRight />}
                    onClick={() => setPhase({ kind: "reward" })}
                  >
                    Tiếp tục
                  </LittleButton>
                }
              />
            ) : null
          }
        >
          {CHOICES.map((c) => (
            <ImageChoice
              key={c.id}
              illustration={c.illustration}
              label={c.label}
              state={stateOf(c.id)}
              feedbackKey={tries}
              onSelect={() => choose(c.id)}
            />
          ))}
        </QuestionCard>
      )}
    </Demo>
  );
}

// ── Mascot & answer states ─────────────────────────────────────────────────

const STATES: AnswerState[] = [
  "idle",
  "selected",
  "correct",
  "tryAgain",
  "reveal",
  "dimmed",
];

function MascotAndAnswers() {
  return (
    <>
      <Demo
        title="LittleMascot (placeholder art)"
        note="Event-driven motion only: cheer hops once, encourage nods once, talk moves the mouth while speaking."
      >
        <div className="flex flex-wrap gap-6">
          {MASCOT_STATES.map((s) => (
            <figure key={s} className="flex flex-col items-center gap-2">
              <LittleMascot state={s} size={96} label={`Mascot: ${s}`} />
              <figcaption className="text-body-sm font-bold text-ink-muted">
                {s}
              </figcaption>
            </figure>
          ))}
        </div>
      </Demo>
      <Demo
        title="AnswerOption states"
        note="Selection and grading use outline + tint + icon + motion, never colour alone. Try-again is coral, never red."
      >
        <div className="flex flex-wrap gap-5">
          {STATES.map((s) => (
            <figure key={s} className="flex flex-col items-center gap-2">
              <AnswerOption label={`Trạng thái ${s}`} state={s} size="md">
                <LittleIllustration name="shape.star" decorative />
              </AnswerOption>
              <figcaption className="text-body-sm font-bold text-ink-muted">
                {s}
              </figcaption>
            </figure>
          ))}
        </div>
      </Demo>
      <Demo title="AudioPlayer">
        <div className="flex flex-wrap items-start gap-6">
          <AudioPlayer
            source={{ text: "Xin chào! Mình là bạn Nắng.", lang: "vi-VN" }}
            demo
          />
          <AudioPlayer
            source={{ text: "Hello! Let's play together.", lang: "en-US" }}
            size="lg"
            demo
            label="Nghe tiếng Anh"
          />
        </div>
      </Demo>
    </>
  );
}

// ── Activities ─────────────────────────────────────────────────────────────

function useDemoCheck<T>(isCorrect: (value: T) => boolean, tries = 2) {
  const { playSfx } = useAudio();
  const [status, setStatus] = useState<ActivityStatus>("editing");
  const [attempt, setAttempt] = useState(0);
  const [round, setRound] = useState(0);
  const submit = (value: T) => {
    const next = attempt + 1;
    setAttempt(next);
    if (isCorrect(value)) {
      playSfx("correct");
      setStatus("correct");
    } else {
      playSfx("tryAgain");
      setStatus(next >= tries ? "reveal" : "tryAgain");
    }
  };
  const reset = () => {
    setStatus("editing");
    setAttempt(0);
    setRound((r) => r + 1);
  };
  return { status, attempt, round, submit, reset };
}

function StatusLine({
  status,
  onReset,
}: {
  status: ActivityStatus;
  onReset: () => void;
}) {
  const text = {
    editing: "",
    correct: "Đúng rồi!",
    tryAgain: "Gần đúng rồi, thử lại nhé!",
    reveal: "Đây là đáp án đúng.",
  }[status];
  return (
    <div className="flex min-h-12 flex-wrap items-center justify-center gap-3">
      {text && (
        <p role="status" className="text-h3">
          {text}
        </p>
      )}
      {(status === "correct" || status === "reveal") && (
        <LittleButton
          size="sm"
          variant="secondary"
          iconStart={<RotateCcw />}
          onClick={onReset}
        >
          Làm lại
        </LittleButton>
      )}
    </div>
  );
}

const SIZES_ORDER = [SQUARE, CIRCLE, STAR];
const SEQUENCE_ANSWER = ["circle", "square", "star"];

const MEMORY_CARDS: MemoryCard[] = [
  { id: "m1", pairKey: "ball", label: "Quả bóng", illustration: "object.ball" },
  { id: "m2", pairKey: "star", label: "Ngôi sao", illustration: "shape.star" },
  {
    id: "m3",
    pairKey: "circle",
    label: "Hình tròn",
    illustration: "shape.circle",
  },
  { id: "m4", pairKey: "ball", label: "Quả bóng", illustration: "object.ball" },
  {
    id: "m5",
    pairKey: "triangle",
    label: "Hình tam giác",
    illustration: "shape.triangle",
  },
  {
    id: "m6",
    pairKey: "circle",
    label: "Hình tròn",
    illustration: "shape.circle",
  },
  { id: "m7", pairKey: "star", label: "Ngôi sao", illustration: "shape.star" },
  {
    id: "m8",
    pairKey: "triangle",
    label: "Hình tam giác",
    illustration: "shape.triangle",
  },
];

function Activities() {
  const seq = useDemoCheck<string[]>(
    (v) => v.join() === SEQUENCE_ANSWER.join(),
  );
  const pat = useDemoCheck<string[]>((v) => v.join() === "circle,triangle");
  const match = useDemoCheck<Array<[string, string]>>((pairs) =>
    pairs.every(([l, r]) => l === r.replace("-r", "")),
  );
  const [memoryKey, setMemoryKey] = useState(0);
  const [memoryDone, setMemoryDone] = useState<number | null>(null);

  return (
    <div className="grid gap-6 desktop:grid-cols-2">
      <LittleCard surface="muted" elevation="none">
        <h3 className="text-h3">SequenceBuilder</h3>
        <p className="mb-4 text-body-sm text-ink-muted">
          Xếp theo thứ tự: hình tròn → hình vuông → ngôi sao. Chạm thẻ để đặt,
          chạm ô để bỏ ra.
        </p>
        <SequenceBuilder
          key={seq.round}
          items={SIZES_ORDER}
          status={seq.status}
          attempt={seq.attempt}
          revealOrder={SEQUENCE_ANSWER}
          onSubmit={seq.submit}
        />
        <StatusLine status={seq.status} onReset={seq.reset} />
      </LittleCard>

      <LittleCard surface="muted" elevation="none">
        <h3 className="text-h3">PatternBuilder</h3>
        <p className="mb-4 text-body-sm text-ink-muted">
          Hoàn thành quy luật tròn – tam giác.
        </p>
        <PatternBuilder
          key={pat.round}
          sequence={[
            { item: CIRCLE },
            { item: TRIANGLE },
            { item: CIRCLE },
            { item: TRIANGLE },
            { blank: true },
            { blank: true },
          ]}
          palette={[CIRCLE, TRIANGLE, SQUARE]}
          status={pat.status}
          attempt={pat.attempt}
          revealFills={["circle", "triangle"]}
          onSubmit={pat.submit}
        />
        <StatusLine status={pat.status} onReset={pat.reset} />
      </LittleCard>

      <LittleCard surface="muted" elevation="none">
        <h3 className="text-h3">MatchingGame</h3>
        <p className="mb-4 text-body-sm text-ink-muted">
          Ghép mỗi hình với hình giống nó. Mỗi cặp có màu và ký hiệu riêng.
        </p>
        <MatchingGame
          key={match.round}
          left={[CIRCLE, TRIANGLE, STAR]}
          right={[
            { ...TRIANGLE, id: "triangle-r" },
            { ...STAR, id: "star-r" },
            { ...CIRCLE, id: "circle-r" },
          ]}
          status={match.status}
          attempt={match.attempt}
          revealPairs={[
            ["circle", "circle-r"],
            ["triangle", "triangle-r"],
            ["star", "star-r"],
          ]}
          onSubmit={match.submit}
        />
        <StatusLine status={match.status} onReset={match.reset} />
      </LittleCard>

      <LittleCard surface="muted" elevation="none">
        <h3 className="text-h3">MemoryGame</h3>
        <p className="mb-4 text-body-sm text-ink-muted">
          Lật hai thẻ giống nhau.
        </p>
        <div className="flex justify-center">
          <MemoryGame
            key={memoryKey}
            cards={MEMORY_CARDS}
            columns={4}
            onComplete={({ moves }) => setMemoryDone(moves)}
          />
        </div>
        <div className="mt-3 flex min-h-12 flex-wrap items-center justify-center gap-3">
          {memoryDone !== null && (
            <p role="status" className="text-h3">
              Xong sau {memoryDone} lượt!
            </p>
          )}
          <LittleButton
            size="sm"
            variant="secondary"
            iconStart={<RotateCcw />}
            onClick={() => {
              setMemoryDone(null);
              setMemoryKey((k) => k + 1);
            }}
          >
            Chơi lại
          </LittleButton>
        </div>
      </LittleCard>

      <LittleCard
        surface="muted"
        elevation="none"
        className="desktop:col-span-2"
      >
        <h3 className="text-h3">DragDropContainer</h3>
        <p className="text-body-sm text-ink-muted">
          Documented, not implemented in this sprint. Every activity above
          already works by tapping (required by WCAG 2.5.7 as the non-drag
          alternative). Drag will be added later as an enhancement on top of the
          same components.
        </p>
      </LittleCard>
    </div>
  );
}

// ── Feedback & reward ──────────────────────────────────────────────────────

function FeedbackAndReward() {
  const [rewardKey, setRewardKey] = useState(0);
  return (
    <>
      <Demo title="FeedbackPanel">
        <div className="flex flex-col gap-3">
          <FeedbackPanel kind="success" message="Đúng rồi! Giỏi quá!" />
          <FeedbackPanel
            kind="tryAgain"
            message="Gần đúng rồi! Con thử lại nhé."
          />
          <FeedbackPanel kind="reveal" message="Cùng xem đáp án nhé." />
        </div>
      </Demo>
      <Demo title="RewardPanel" note="Reveal ≈ 700 ms, then still.">
        <RewardPanel
          key={rewardKey}
          title="Hoàn thành bài học!"
          starsEarned={2}
          sticker={{
            illustration: "reward.sticker-star",
            label: "Nhãn dán Ngôi sao",
          }}
          action={
            <LittleButton
              variant="reward"
              size="lg"
              iconStart={<RotateCcw />}
              onClick={() => setRewardKey((k) => k + 1)}
            >
              Xem lại hiệu ứng
            </LittleButton>
          }
        />
      </Demo>
    </>
  );
}
