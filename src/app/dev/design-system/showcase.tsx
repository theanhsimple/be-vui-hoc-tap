"use client";

import { type ReactNode, useState } from "react";

import { AudioPromptButton } from "@/components/kid/AudioPromptButton";
import {
  BigChoice,
  CHOICE_STATES,
  type ChoiceState,
} from "@/components/kid/BigChoice";
import {
  MASCOT_STATES,
  Mascot,
  type MascotState,
} from "@/components/kid/Mascot";
import { ParentGate } from "@/components/kid/ParentGate";
import { ProgressPath } from "@/components/kid/ProgressPath";
import { StarBurst } from "@/components/kid/StarBurst";
import { AdminShell } from "@/components/layout/AdminShell";
import { KidShell } from "@/components/layout/KidShell";
import { Logo } from "@/components/layout/Logo";
import { ParentShell } from "@/components/layout/ParentShell";
import { Button3D, IconButton3D } from "@/components/ui/Button3D";
import { Card } from "@/components/ui/Card";
import { SpeechBubble } from "@/components/ui/SpeechBubble";
import { BackIcon, LockIcon } from "@/components/ui/icons";
import { TONE_NAMES } from "@/components/ui/tones";
import { type PlayOutcome, useAudio } from "@/lib/audio";

const SWATCHES = [
  ["sky-100", "#EAF6FF"],
  ["sky-200", "#D3ECFF"],
  ["sky-400", "#7CC4FF"],
  ["sky-600", "#2F8EE0"],
  ["cream-50", "#FFFBF4"],
  ["ink-900", "#1E2A55"],
  ["ink-600", "#56608A"],
  ["peach-300", "#FFC9A8"],
  ["mint-300", "#A8E6CF"],
  ["mint-400", "#6FD6A8"],
  ["lilac-300", "#CDBDFF"],
  ["lilac-400", "#A992FF"],
  ["butter-300", "#FFE38A"],
  ["butter-400", "#FFD45C"],
  ["rose-300", "#FFB3C7"],
  ["rose-400", "#FF8FAE"],
  ["coral-400", "#FF8A7A"],
] as const;

const SECTIONS = [
  ["colours", "Màu sắc"],
  ["type", "Chữ"],
  ["buttons", "Nút"],
  ["surfaces", "Thẻ & bong bóng"],
  ["mascot", "Mascot"],
  ["audio", "Âm thanh"],
  ["choices", "Lựa chọn"],
  ["progress", "Tiến độ & phần thưởng"],
  ["gate", "Cổng phụ huynh"],
  ["shells", "Khung màn hình"],
] as const;

export function DesignSystemShowcase() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
      <header className="flex flex-wrap items-end gap-4">
        <Logo className="text-[44px]" />
        <div>
          <h1 className="text-[28px] font-extrabold">Design system</h1>
          <p className="text-[15px] text-ink-600">
            Nội bộ · Sprint 01. Mascot là hình tạm (SVG); âm thanh dùng giọng
            đọc của trình duyệt cho đến khi có file thu âm.
          </p>
        </div>
      </header>

      <nav aria-label="Mục lục" className="mt-6 flex flex-wrap gap-2">
        {SECTIONS.map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className="rounded-full bg-white px-4 py-2 text-[15px] font-semibold shadow-soft"
          >
            {label}
          </a>
        ))}
      </nav>

      <AudioStatus />

      <Section id="colours" title="Màu sắc">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {SWATCHES.map(([name, hex]) => (
            <div
              key={name}
              className="overflow-hidden rounded-md bg-white shadow-soft"
            >
              <div className="h-16" style={{ background: `var(--${name})` }} />
              <div className="px-3 py-2 text-[13px]">
                <div className="font-bold">{name}</div>
                <div className="text-ink-600">{hex}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="type" title="Chữ — Nunito Sans">
        <div className="space-y-3">
          <p className="text-[52px] leading-[1.1] font-extrabold">
            Bé khám phá thế giới
          </p>
          <p className="text-[32px] leading-[1.1] font-extrabold">
            1 2 3 4 5 · Quả táo đỏ
          </p>
          <p className="text-[32px] leading-[1.2] font-extrabold">
            Tiêu đề phụ huynh (H1)
          </p>
          <p className="text-[24px] leading-[1.25] font-bold">
            Tiêu đề mục (H2)
          </p>
          <p className="max-w-prose text-[17px]">
            Nội dung: Bé đếm chắc chắn đến 10 và bắt đầu so sánh nhiều hơn, ít
            hơn. Dấu tiếng Việt cần khoảng cách dòng rộng: ắ ằ ẳ ẵ ặ ế ề ể ễ ệ ố
            ồ ổ ỗ ộ ứ ừ ử ữ ự.
          </p>
          <p className="text-[14px] font-semibold text-ink-600">
            Chú thích nhỏ
          </p>
        </div>
      </Section>

      <Section id="buttons" title="Nút 3D">
        <div className="flex flex-wrap items-center gap-4">
          {TONE_NAMES.map((tone) => (
            <Button3D key={tone} tone={tone} size="kid">
              {tone}
            </Button3D>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Button3D size="sm">Nhỏ 44</Button3D>
          <Button3D size="md">Vừa 52</Button3D>
          <Button3D size="kid">Bé 72</Button3D>
          <Button3D size="hero" tone="butter">
            Chơi nào!
          </Button3D>
          <Button3D size="md" disabled>
            Không khả dụng
          </Button3D>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <IconButton3D label="Quay lại" tone="cream" size="kid">
            <BackIcon className="size-8" />
          </IconButton3D>
          <IconButton3D label="Khu vực phụ huynh" tone="cream" size="md">
            <LockIcon className="size-6" />
          </IconButton3D>
        </div>
      </Section>

      <Section id="surfaces" title="Thẻ & bong bóng lời thoại">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              "cream",
              "white",
              "butter",
              "mint",
              "lilac",
              "rose",
              "peach",
              "sky",
            ] as const
          ).map((s) => (
            <Card key={s} surface={s}>
              <div className="text-[17px] font-bold">{s}</div>
              <div className="text-[14px] text-ink-600">Card surface</div>
            </Card>
          ))}
        </div>
        <div className="mt-6 flex flex-col gap-6 rounded-lg bg-sky-200 p-6">
          <div className="flex items-center gap-4">
            <Mascot size={88} />
            <SpeechBubble>Con hãy chạm vào quả táo màu đỏ nhé!</SpeechBubble>
          </div>
          <SpeechBubble size="parent" tail="bottom" className="max-w-md">
            Bong bóng cỡ phụ huynh, đuôi hướng xuống.
          </SpeechBubble>
        </div>
      </Section>

      <MascotSection />
      <AudioSection />
      <ChoicesSection />
      <ProgressSection />
      <GateSection />
      <ShellsSection />
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mt-12 scroll-mt-6">
      <h2 className="mb-4 text-[24px] font-extrabold">{title}</h2>
      {children}
    </section>
  );
}

function AudioStatus() {
  const { unlocked, voiceEnabled, sfxEnabled, setVoiceEnabled, setSfxEnabled } =
    useAudio();
  return (
    <Card
      surface="white"
      padding="sm"
      className="mt-6 flex flex-wrap items-center gap-4"
    >
      <span className="text-[15px] font-bold">
        Âm thanh: {unlocked ? "đã mở khóa" : "chạm vào bất kỳ đâu để mở khóa"}
      </span>
      <label className="flex min-h-11 items-center gap-2 text-[15px]">
        <input
          type="checkbox"
          className="size-5"
          checked={voiceEnabled}
          onChange={(e) => setVoiceEnabled(e.target.checked)}
        />
        Giọng đọc
      </label>
      <label className="flex min-h-11 items-center gap-2 text-[15px]">
        <input
          type="checkbox"
          className="size-5"
          checked={sfxEnabled}
          onChange={(e) => setSfxEnabled(e.target.checked)}
        />
        Hiệu ứng
      </label>
    </Card>
  );
}

function MascotSection() {
  const [state, setState] = useState<MascotState>("idle");
  return (
    <Section id="mascot" title="Mascot (hình tạm)">
      <div className="flex flex-wrap gap-6">
        {MASCOT_STATES.map((s) => (
          <figure key={s} className="flex flex-col items-center gap-2">
            <Mascot state={s} size={110} label={`Mascot: ${s}`} />
            <figcaption className="text-[14px] font-bold text-ink-600">
              {s}
            </figcaption>
          </figure>
        ))}
      </div>
      <Card surface="sky" className="mt-6 flex flex-wrap items-center gap-6">
        <Mascot state={state} size={180} />
        <div className="flex flex-wrap gap-2">
          {MASCOT_STATES.map((s) => (
            <Button3D
              key={s}
              size="sm"
              tone={s === state ? "butter" : "cream"}
              onClick={() => setState(s)}
            >
              {s}
            </Button3D>
          ))}
        </div>
      </Card>
    </Section>
  );
}

function AudioSection() {
  const { playSfx } = useAudio();
  const [outcome, setOutcome] = useState<PlayOutcome | null>(null);
  return (
    <Section id="audio" title="Âm thanh">
      <div className="flex flex-wrap items-center gap-4">
        <AudioPromptButton
          source={{
            text: "Con hãy chạm vào quả táo màu đỏ nhé!",
            lang: "vi-VN",
          }}
          onOutcome={setOutcome}
        />
        <span className="text-[17px]">Tiếng Việt (giọng trình duyệt)</span>
        <AudioPromptButton
          source={{ text: "Find the red apple!", lang: "en-US" }}
          onOutcome={setOutcome}
        />
        <span className="text-[17px]">English</span>
      </div>
      <p className="mt-3 text-[15px] text-ink-600" aria-live="polite">
        Kết quả lần phát gần nhất: <strong>{outcome ?? "—"}</strong>
        {outcome === "unavailable" &&
          " (thiết bị này không có giọng đọc phù hợp — cần file thu âm)"}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        {(["tap", "correct", "tryAgain", "reward"] as const).map((k) => (
          <Button3D key={k} size="md" tone="lilac" onClick={() => playSfx(k)}>
            SFX: {k}
          </Button3D>
        ))}
      </div>
    </Section>
  );
}

const DEMO = [
  { id: "apple", label: "Quả táo", pic: "🍎" },
  { id: "banana", label: "Quả chuối", pic: "🍌" },
  { id: "grapes", label: "Chùm nho", pic: "🍇" },
] as const;
const DEMO_ANSWER = "apple";

function ChoicesSection() {
  const { playSfx } = useAudio();
  const [tries, setTries] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [resolved, setResolved] = useState<"correct" | "shown" | null>(null);

  const stateOf = (id: string): ChoiceState => {
    if (resolved === "correct")
      return id === DEMO_ANSWER ? "correct" : "dimmed";
    if (resolved === "shown")
      return id === DEMO_ANSWER ? "demonstrate" : "dimmed";
    return picked === id ? "tryAgain" : "idle";
  };

  const choose = (id: string) => {
    if (id === DEMO_ANSWER) {
      playSfx("correct");
      setResolved("correct");
      return;
    }
    playSfx("tryAgain");
    const next = tries + 1;
    setTries(next);
    setPicked(id);
    if (next >= 2) setResolved("shown");
  };

  return (
    <Section id="choices" title="Lựa chọn lớn (BigChoice)">
      <div className="flex flex-wrap gap-6">
        {CHOICE_STATES.map((s) => (
          <figure key={s} className="flex flex-col items-center gap-3">
            <BigChoice label={`Ví dụ trạng thái ${s}`} state={s} size="md">
              🍎
            </BigChoice>
            <figcaption className="text-[14px] font-bold text-ink-600">
              {s}
            </figcaption>
          </figure>
        ))}
      </div>
      <Card surface="sky" className="mt-8">
        <p className="text-[15px] font-bold text-ink-600">
          Minh họa luồng phản hồi: sai 2 lần thì chỉ ra đáp án (đáp án minh họa:
          quả táo)
        </p>
        <div className="mt-4 flex flex-wrap gap-6">
          {DEMO.map((c) => (
            <BigChoice
              key={c.id}
              label={c.label}
              state={stateOf(c.id)}
              feedbackKey={tries}
              onSelect={() => choose(c.id)}
            >
              <span className="text-[88px] leading-none">{c.pic}</span>
            </BigChoice>
          ))}
        </div>
        <Button3D
          size="sm"
          tone="cream"
          className="mt-6"
          onClick={() => {
            setTries(0);
            setPicked(null);
            setResolved(null);
          }}
        >
          Làm lại
        </Button3D>
      </Card>
    </Section>
  );
}

function ProgressSection() {
  const total = 6;
  const [current, setCurrent] = useState(2);
  const [show, setShow] = useState(true);
  const [earned, setEarned] = useState(3);
  const { playSfx } = useAudio();
  return (
    <Section id="progress" title="Tiến độ & phần thưởng">
      <Card surface="sky" className="flex flex-col items-start gap-4">
        <ProgressPath total={total} current={current} />
        <div className="flex gap-2">
          <Button3D
            size="sm"
            tone="cream"
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          >
            Lùi
          </Button3D>
          <Button3D
            size="sm"
            tone="cream"
            onClick={() => setCurrent((c) => Math.min(total, c + 1))}
          >
            Tiến
          </Button3D>
        </div>
      </Card>
      <Card surface="sky" className="mt-6 flex flex-col items-center gap-6">
        <div className="grid h-40 place-items-center">
          <StarBurst show={show} earned={earned} />
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {[1, 2, 3].map((n) => (
            <Button3D
              key={n}
              size="sm"
              tone={n === earned ? "butter" : "cream"}
              onClick={() => {
                setEarned(n);
                setShow(false);
                requestAnimationFrame(() => {
                  setShow(true);
                  playSfx("reward");
                });
              }}
            >
              {n} sao
            </Button3D>
          ))}
        </div>
      </Card>
    </Section>
  );
}

function GateSection() {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  return (
    <Section id="gate" title="Cổng phụ huynh">
      <div className="flex flex-wrap items-center gap-4">
        <IconButton3D
          label="Khu vực phụ huynh"
          tone="cream"
          size="md"
          onClick={() => setOpen(true)}
        >
          <LockIcon className="size-6" />
        </IconButton3D>
        <span className="text-[15px] text-ink-600" aria-live="polite">
          {result ?? "Mở cổng, đọc yêu cầu và nhấn giữ đúng số."}
        </span>
      </div>
      <ParentGate
        open={open}
        onPass={() => {
          setOpen(false);
          setResult("Đã qua cổng phụ huynh.");
        }}
        onCancel={() => {
          setOpen(false);
          setResult("Đã đóng cổng.");
        }}
      />
    </Section>
  );
}

function ShellsSection() {
  return (
    <Section id="shells" title="Khung màn hình">
      <p className="mb-3 text-[15px] text-ink-600">
        KidShell — iPad ngang (4:3)
      </p>
      <div className="aspect-[4/3] max-h-[640px] w-full overflow-hidden rounded-xl ring-8 ring-ink-900">
        <KidShell
          fill="container"
          topBar={
            <>
              <IconButton3D label="Quay lại" tone="cream" size="kid">
                <BackIcon className="size-8" />
              </IconButton3D>
              <ProgressPath total={5} current={1} />
              <IconButton3D label="Khu vực phụ huynh" tone="cream" size="md">
                <LockIcon className="size-6" />
              </IconButton3D>
            </>
          }
          guide={
            <>
              <Mascot state="talk" size={96} />
              <SpeechBubble className="flex-1">
                Có bao nhiêu quả táo?
              </SpeechBubble>
              <AudioPromptButton source={{ text: "Có bao nhiêu quả táo?" }} />
            </>
          }
          actions={
            <>
              {[2, 3, 4].map((n) => (
                <BigChoice key={n} label={`Số ${n}`} size="md" tone="butter">
                  {n}
                </BigChoice>
              ))}
            </>
          }
        >
          <span className="text-[72px] leading-none">🍎🍎🍎</span>
        </KidShell>
      </div>

      <p className="mt-10 mb-3 text-[15px] text-ink-600">ParentShell</p>
      <div className="overflow-hidden rounded-lg ring-1 ring-sky-200">
        <ParentShell
          nav={
            <>
              <a
                href="#shells"
                className="rounded-sm px-3 py-2 text-[15px] font-semibold"
              >
                Tổng quan
              </a>
              <a
                href="#shells"
                className="rounded-sm px-3 py-2 text-[15px] font-semibold text-ink-600"
              >
                Cài đặt
              </a>
            </>
          }
        >
          <h3 className="text-[32px] font-extrabold">Xin chào!</h3>
          <p className="mt-2 text-[17px] text-ink-600">
            Nội dung trang phụ huynh hiển thị ở đây.
          </p>
        </ParentShell>
      </div>

      <p className="mt-10 mb-3 text-[15px] text-ink-600">AdminShell</p>
      <div className="overflow-x-auto rounded-lg ring-1 ring-sky-200">
        <AdminShell
          title="Modules"
          className="min-w-[960px]"
          nav={[
            { href: "#shells", label: "Tổng quan" },
            { href: "#shells", label: "Modules", current: true },
            { href: "#shells", label: "Skills" },
            { href: "#shells", label: "Question Bank" },
            { href: "#shells", label: "Lessons" },
            { href: "#shells", label: "Assessments" },
            { href: "#shells", label: "Media" },
          ]}
        >
          <p className="text-[15px] text-ink-600">
            Nội dung CMS hiển thị ở đây.
          </p>
        </AdminShell>
      </div>
    </Section>
  );
}
