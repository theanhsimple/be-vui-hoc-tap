"use client";

import {
  Archive,
  ChartNoAxesColumn,
  Clock,
  Gamepad2,
  HeartHandshake,
  House,
  Lock,
  MessageCircle,
  Pencil,
  Play,
  RotateCcw,
  Settings,
  Trash2,
  UserPlus,
  Volume2,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useState, useSyncExternalStore } from "react";

import { TextField, FormMessage } from "@/components/forms/FormBits";
import { ParentShell } from "@/components/layout/ParentShell";
import { ParentGate } from "@/components/navigation/ParentGate";
import { ChildDashboard } from "@/components/parent/ChildDashboard";
import { ChildForm } from "@/components/parent/ChildForm";
import { ChildProfileCard } from "@/components/parent/ChildProfileCard";
import { LittleAvatar } from "@/components/ui/LittleAvatar";
import { LittleButton } from "@/components/ui/LittleButton";
import { LittleCard } from "@/components/ui/LittleCard";
import { LittleLinkButton } from "@/components/ui/LittleLinkButton";
import { LittleStatePanel } from "@/components/ui/LittleStatePanel";
import { ageLabel } from "@/features/family/age";
import { childSchema } from "@/features/family/schemas";
import {
  echo,
  fieldErrors,
  type FormState,
  formError,
  IDLE,
} from "@/features/forms";
import { toAvatar } from "@/features/learning/backend/overview";

import { deviceContent } from "../content";
import * as E from "../engine";
import {
  grantParentAccess,
  hasParentAccess,
  revokeParentAccess,
  subscribeParentAccess,
} from "../runtime";
import type { DeviceChild } from "../state";
import { updateDevice, useDeviceState } from "../store";

const ITEMS = [
  { id: "family", label: "Gia đình", href: "/parent", icon: <House /> },
  {
    id: "add",
    label: "Thêm bé",
    href: "/parent/children/new",
    icon: <UserPlus />,
  },
  {
    id: "learn",
    label: "Cho bé học",
    href: "/student/profiles",
    icon: <Gamepad2 />,
  },
  {
    id: "settings",
    label: "Cài đặt",
    href: "/parent/settings",
    icon: <Settings />,
  },
] as const;
type NavId = (typeof ITEMS)[number]["id"];

/**
 * Parent area of the device edition. There are no accounts: the adult-only
 * parent gate protects it (remembered for 30 minutes in this tab).
 */
export function ParentArea({
  current,
  children,
}: {
  current?: NavId;
  children: ReactNode;
}) {
  const router = useRouter();
  // null while prerendering (no sessionStorage on the build machine).
  const allowed = useSyncExternalStore(
    subscribeParentAccess,
    hasParentAccess,
    () => null,
  );

  return (
    <ParentShell
      items={ITEMS}
      currentId={current}
      actions={
        <button
          type="button"
          onClick={() => {
            revokeParentAccess();
            router.push("/student/profiles");
          }}
          className="flex min-h-11 items-center gap-2 rounded-pill px-4 text-body font-bold text-ink-muted hover:bg-surface hover:text-ink [&_svg]:size-5"
        >
          <Lock aria-hidden />
          Khoá
        </button>
      }
    >
      <main>
        {allowed ? (
          children
        ) : allowed === null ? (
          <LittleStatePanel kind="loading" />
        ) : (
          <LittleStatePanel
            kind="empty"
            title="Khu vực dành cho bố mẹ"
            description="Bố mẹ xác nhận người lớn để tiếp tục."
            action={
              <LittleLinkButton href="/student/profiles" variant="secondary">
                Quay lại cho bé
              </LittleLinkButton>
            }
          />
        )}
        <ParentGate
          open={allowed === false}
          onCancel={() => router.push("/student/profiles")}
          onPass={grantParentAccess}
        />
      </main>
    </ParentShell>
  );
}

function Notice({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <p
      role="status"
      className="rounded-md bg-success-50 p-3 text-body font-semibold text-success-strong"
    >
      {text}
    </p>
  );
}

const SAVED: Record<string, string> = {
  child: "Đã lưu hồ sơ của bé.",
  updated: "Đã lưu hồ sơ của bé.",
  archived: "Đã lưu trữ hồ sơ. Kết quả học tập vẫn được giữ lại.",
  restored: "Đã khôi phục hồ sơ của bé.",
  deleted: "Đã xoá vĩnh viễn hồ sơ và toàn bộ dữ liệu học tập của bé.",
  discover: "Bé đã hoàn thành hoạt động khám phá.",
  restoredBackup: "Đã khôi phục dữ liệu từ tệp sao lưu.",
  erased: "Đã xoá toàn bộ dữ liệu trên thiết bị này.",
};
function useSaved() {
  const saved = useSearchParams().get("saved");
  return saved ? SAVED[saved] : undefined;
}
function useChildParam(): string | null {
  return useSearchParams().get("id");
}

function StartLearning({ child }: { child: DeviceChild }) {
  const router = useRouter();
  return (
    <LittleButton
      iconStart={<Gamepad2 />}
      aria-label={`Cho bé học: ${child.nickname}`}
      onClick={() => {
        updateDevice((s) => ({
          state: E.selectChild(s, child.id),
          result: null,
        }));
        router.push("/student/home");
      }}
    >
      Cho bé học
    </LittleButton>
  );
}

// ── Family home ─────────────────────────────────────────────────────────

export function DeviceFamily() {
  const state = useDeviceState();
  const notice = useSaved();
  const [now] = useState(() => Date.now());
  if (!state) return <LittleStatePanel kind="loading" />;
  const active = state.children.filter((c) => c.status === "active");
  const archived = state.children.filter((c) => c.status === "archived");
  const backupDays = state.lastBackupAt
    ? Math.floor((now - Date.parse(state.lastBackupAt)) / 86_400_000)
    : null;
  const hasProgress = state.sessions.some((s) => s.status === "completed");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-body-sm font-bold text-ink-muted">
            Trên thiết bị này
          </p>
          <h1 className="text-display">Gia đình</h1>
        </div>
        <LittleLinkButton href="/parent/children/new" iconStart={<UserPlus />}>
          Thêm hồ sơ bé
        </LittleLinkButton>
      </div>
      <Notice text={notice} />
      {hasProgress && (backupDays === null || backupDays >= 7) && (
        <LittleCard
          surface="yellow"
          elevation="none"
          className="flex flex-wrap items-center gap-3"
        >
          <p className="min-w-0 flex-1 text-body">
            {backupDays === null
              ? "Kết quả học chỉ lưu trên thiết bị này. Bố mẹ nên tải tệp sao lưu để không bị mất."
              : `Lần sao lưu gần nhất cách đây ${backupDays} ngày.`}
          </p>
          <LittleLinkButton href="/parent/settings" variant="secondary">
            Sao lưu
          </LittleLinkButton>
        </LittleCard>
      )}
      {active.length === 0 ? (
        <LittleStatePanel
          kind="empty"
          title="Chưa có hồ sơ của bé"
          description="Tạo hồ sơ đầu tiên để bé bắt đầu khám phá."
          action={
            <LittleLinkButton href="/parent/children/new" size="lg">
              Tạo hồ sơ cho bé
            </LittleLinkButton>
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 desktop:grid-cols-2">
          {active.map((c) => (
            <li key={c.id}>
              <ChildProfileCard
                nickname={c.nickname}
                avatar={toAvatar(c.avatarKey)}
                ageLabel={ageLabel(c.birthYear) || "Chưa có năm sinh"}
                actions={
                  <>
                    <StartLearning child={c} />
                    <LittleLinkButton
                      href={`/parent/child?id=${c.id}`}
                      variant="secondary"
                      iconStart={<ChartNoAxesColumn />}
                      aria-label={`Xem tiến độ của ${c.nickname}`}
                    >
                      Tiến độ
                    </LittleLinkButton>
                  </>
                }
              />
            </li>
          ))}
        </ul>
      )}
      {archived.length > 0 && (
        <details className="rounded-md bg-surface p-4">
          <summary className="min-h-11 cursor-pointer content-center text-body font-bold">
            Hồ sơ đã lưu trữ ({archived.length})
          </summary>
          <ul className="mt-2 flex flex-col gap-1 text-body">
            {archived.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/parent/child?id=${c.id}`}
                  className="inline-flex min-h-11 items-center font-bold text-blue-strong underline-offset-4 hover:underline"
                >
                  {c.nickname}
                </Link>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

// ── Child form (create / edit) ──────────────────────────────────────────

const CHILD_FIELDS = [
  "nickname",
  "avatar",
  "birthYear",
  "voice",
  "sounds",
  "sessionMinutes",
];

function parseChild(form: FormData) {
  return childSchema.safeParse({
    nickname: form.get("nickname") ?? "",
    avatar: form.get("avatar") ?? "",
    birthYear: form.get("birthYear") ?? "",
    voice: form.get("voice") ?? undefined,
    sounds: form.get("sounds") ?? undefined,
    sessionMinutes: form.get("sessionMinutes") ?? "",
  });
}

const childMessage = (e: unknown) =>
  e instanceof E.EngineError && e.code === "child_limit"
    ? "Mỗi thiết bị có tối đa 6 hồ sơ bé đang học."
    : "Chưa lưu được. Vui lòng thử lại.";

export function DeviceNewChild() {
  const router = useRouter();
  const state = useDeviceState();
  if (!state) return <LittleStatePanel kind="loading" />;
  const first = state.children.length === 0;

  async function action(_prev: FormState, form: FormData): Promise<FormState> {
    const parsed = parseChild(form);
    if (!parsed.success)
      return {
        status: "error",
        fieldErrors: fieldErrors(parsed.error),
        values: echo(form, CHILD_FIELDS),
      };
    const { nickname, avatar, birthYear, voice, sounds, sessionMinutes } =
      parsed.data;
    try {
      const id = updateDevice((s) => {
        const r = E.createChild(
          s,
          {
            nickname,
            avatarKey: avatar,
            birthYear,
            preferences: { voice, sounds, sessionMinutes },
          },
          new Date(),
        );
        return { state: r.state, result: r.childId };
      });
      router.push(
        first
          ? `/parent/child/discover?id=${id}&welcome=1`
          : "/parent?saved=child",
      );
      return IDLE;
    } catch (e) {
      return formError(childMessage(e), echo(form, CHILD_FIELDS));
    }
  }

  return (
    <LittleCard
      padding="lg"
      className="mx-auto flex w-full max-w-2xl flex-col gap-4"
    >
      <h1 className="text-h1">Thêm hồ sơ cho bé</h1>
      <p className="text-body text-ink-muted">
        Hồ sơ và kết quả học được lưu trên thiết bị này, không gửi đi đâu.
      </p>
      <ChildForm
        action={action}
        submitLabel="Tạo hồ sơ"
        currentYear={new Date().getUTCFullYear()}
      />
    </LittleCard>
  );
}

function useChild() {
  const state = useDeviceState();
  const id = useChildParam();
  const child = state && id ? E.getChild(state, id) : undefined;
  return { state, child };
}

function Missing() {
  return (
    <LittleStatePanel
      kind="empty"
      title="Không tìm thấy hồ sơ"
      description="Hồ sơ này không có trên thiết bị."
      action={<LittleLinkButton href="/parent">Về Gia đình</LittleLinkButton>}
    />
  );
}

export function DeviceChildEdit() {
  const router = useRouter();
  const { state, child } = useChild();
  const [confirm, setConfirm] = useState(false);
  if (!state) return <LittleStatePanel kind="loading" />;
  if (!child || child.status !== "active") return <Missing />;
  const id = child.id;

  async function action(_prev: FormState, form: FormData): Promise<FormState> {
    const parsed = parseChild(form);
    if (!parsed.success)
      return {
        status: "error",
        fieldErrors: fieldErrors(parsed.error),
        values: echo(form, CHILD_FIELDS),
      };
    const { nickname, avatar, birthYear, voice, sounds, sessionMinutes } =
      parsed.data;
    try {
      updateDevice((s) => ({
        state: E.updateChild(s, id, {
          nickname,
          avatarKey: avatar,
          birthYear,
          preferences: { voice, sounds, sessionMinutes },
        }),
        result: null,
      }));
      router.push(`/parent/child?id=${id}&saved=updated`);
      return IDLE;
    } catch (e) {
      return formError(childMessage(e), echo(form, CHILD_FIELDS));
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div>
        <LittleLinkButton href={`/parent/child?id=${id}`} variant="ghost">
          ← Tiến độ của {child.nickname}
        </LittleLinkButton>
      </div>
      <LittleCard padding="lg" className="flex flex-col gap-4">
        <h1 className="text-h1">Sửa hồ sơ</h1>
        <ChildForm
          action={action}
          submitLabel="Lưu thay đổi"
          currentYear={new Date().getUTCFullYear()}
          initial={{
            nickname: child.nickname,
            avatar: toAvatar(child.avatarKey),
            birthYear: child.birthYear,
            voice: child.preferences.voice,
            sounds: child.preferences.sounds,
            sessionMinutes: child.preferences.sessionMinutes,
          }}
        />
      </LittleCard>
      <LittleCard className="flex flex-col gap-3">
        <h2 className="text-h3">Lưu trữ hồ sơ</h2>
        {confirm ? (
          <div
            role="group"
            aria-label="Xác nhận lưu trữ"
            className="flex flex-col gap-3 rounded-md bg-warning-50 p-4"
          >
            <p className="text-body font-bold text-warning-strong">
              Lưu trữ hồ sơ của {child.nickname}? Bé sẽ không còn trong danh
              sách chọn bé. Kết quả học tập vẫn được giữ lại.
            </p>
            <div className="flex flex-wrap gap-2">
              <LittleButton
                variant="danger"
                onClick={() => {
                  updateDevice((s) => ({
                    state: E.archiveChild(s, id, new Date()),
                    result: null,
                  }));
                  router.push("/parent?saved=archived");
                }}
              >
                Lưu trữ
              </LittleButton>
              <LittleButton variant="ghost" onClick={() => setConfirm(false)}>
                Huỷ
              </LittleButton>
            </div>
          </div>
        ) : (
          <div>
            <LittleButton
              variant="secondary"
              iconStart={<Archive />}
              onClick={() => setConfirm(true)}
            >
              Lưu trữ hồ sơ
            </LittleButton>
          </div>
        )}
      </LittleCard>
    </div>
  );
}

function ArchivedActions({ child }: { child: DeviceChild }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [state, setState] = useState<FormState>(IDLE);
  return (
    <div className="flex flex-col gap-4">
      <FormMessage state={state.message && !confirm ? state : IDLE} />
      <div>
        <LittleButton
          variant="secondary"
          iconStart={<RotateCcw />}
          onClick={() => {
            try {
              updateDevice((s) => ({
                state: E.restoreChild(s, child.id),
                result: null,
              }));
              router.push(`/parent/child?id=${child.id}&saved=restored`);
            } catch (e) {
              setState(formError(childMessage(e)));
            }
          }}
        >
          Khôi phục hồ sơ
        </LittleButton>
      </div>
      {confirm ? (
        <form
          role="group"
          aria-label="Xác nhận xoá vĩnh viễn"
          className="flex flex-col gap-3 rounded-md bg-error-50 p-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            const value = String(
              new FormData(e.currentTarget).get("confirm") ?? "",
            );
            try {
              updateDevice((s) => ({
                state: E.deleteChild(s, child.id, value),
                result: null,
              }));
              router.push("/parent?saved=deleted");
            } catch {
              setState(
                formError(
                  "Tên gọi chưa khớp. Hãy gõ đúng tên gọi của bé để xác nhận.",
                  { confirm: value },
                ),
              );
            }
          }}
        >
          <p className="text-body font-bold text-error-strong">
            Xoá vĩnh viễn hồ sơ của {child.nickname} và toàn bộ kết quả học tập?
            Không thể hoàn tác.
          </p>
          <TextField
            label={`Gõ “${child.nickname}” để xác nhận`}
            name="confirm"
            autoComplete="off"
            required
            state={state}
          />
          <FormMessage state={state} />
          <div className="flex flex-wrap gap-2">
            <LittleButton type="submit" variant="danger" iconStart={<Trash2 />}>
              Xoá vĩnh viễn
            </LittleButton>
            <LittleButton
              type="button"
              variant="ghost"
              onClick={() => setConfirm(false)}
            >
              Huỷ
            </LittleButton>
          </div>
        </form>
      ) : (
        <div>
          <LittleButton
            variant="ghost"
            iconStart={<Trash2 />}
            onClick={() => setConfirm(true)}
          >
            Xoá vĩnh viễn…
          </LittleButton>
        </div>
      )}
    </div>
  );
}

export function DeviceChildReport() {
  const { state, child } = useChild();
  const notice = useSaved();
  if (!state) return <LittleStatePanel kind="loading" />;
  if (!child) return <Missing />;
  const c = deviceContent();
  const archived = child.status === "archived";
  const now = new Date();
  return (
    <div className="flex flex-col gap-6">
      <LittleCard className="flex flex-wrap items-center gap-4">
        <LittleAvatar
          name={child.nickname}
          avatar={toAvatar(child.avatarKey)}
          size="xl"
          decorative
        />
        <div className="min-w-0 flex-1">
          <h1 className="text-h1">{child.nickname}</h1>
          <p className="text-body text-ink-muted">
            {ageLabel(child.birthYear) || "Chưa có năm sinh"}
            {archived && " · Đã lưu trữ"}
          </p>
        </div>
        {!archived && (
          <div className="flex flex-wrap gap-2">
            <StartLearning child={child} />
            <LittleLinkButton
              href={`/parent/child/edit?id=${child.id}`}
              variant="secondary"
              iconStart={<Pencil />}
            >
              Sửa hồ sơ
            </LittleLinkButton>
          </div>
        )}
      </LittleCard>
      <Notice text={notice} />
      {archived && (
        <LittleCard className="flex flex-col gap-3">
          <h2 className="text-h3">Hồ sơ đã được lưu trữ</h2>
          <p className="text-body text-ink-muted">
            Bé không còn trong danh sách chọn bé. Kết quả học tập vẫn được giữ
            lại bên dưới.
          </p>
          <ArchivedActions child={child} />
        </LittleCard>
      )}
      <ChildDashboard
        childId={child.id}
        report={E.childReport(state, c, child.id, now)}
        catalog={c.catalog}
        guides={c.guides}
        now={now}
        discoverHref={`/parent/child/discover?id=${child.id}`}
      />
    </div>
  );
}

const TIPS = [
  {
    icon: <HeartHandshake />,
    text: "Ngồi cạnh bé. Bé tự chọn câu trả lời; bố mẹ không cần nhắc đáp án.",
  },
  {
    icon: <Volume2 />,
    text: "Bật âm thanh để bé nghe câu hỏi. Bé có thể bấm nghe lại.",
  },
  {
    icon: <MessageCircle />,
    text: "Bé chỉ nghe lời động viên, không thấy đúng hay sai. Mỗi câu chỉ chọn một lần.",
  },
  {
    icon: <Clock />,
    text: "Nếu bé mệt, cứ dừng lại. Lần sau bé chơi tiếp từ câu đang dở.",
  },
];

export function DeviceDiscoverIntro() {
  const router = useRouter();
  const { state, child } = useChild();
  const welcome = useSearchParams().get("welcome") === "1";
  if (!state) return <LittleStatePanel kind="loading" />;
  if (!child || child.status !== "active") return <Missing />;
  const c = deviceContent();
  const open = E.activePlacement(state, child.id);
  const done = Boolean(E.placementSummary(state, c, child.id));
  const go = (restart: boolean) => {
    updateDevice((s) => {
      const r = E.startPlacement(
        E.selectChild(s, child.id),
        c,
        child.id,
        restart,
        new Date(),
      );
      return { state: r.state, result: null };
    });
    router.push(`/student/discover/${c.placement.id}`);
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <Notice
        text={
          welcome
            ? `Đã tạo hồ sơ của ${child.nickname}. Bước tiếp theo (không bắt buộc): cùng bé làm hoạt động khám phá.`
            : undefined
        }
      />
      <LittleCard padding="lg" className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <LittleAvatar
            name={child.nickname}
            avatar={toAvatar(child.avatarKey)}
            size="lg"
            decorative
          />
          <div className="min-w-0">
            <p className="text-body-sm font-bold text-ink-muted">
              Hoạt động khám phá · {c.placement.questions.length} câu
            </p>
            <h1 className="text-h1">
              {c.placement.title} cùng {child.nickname}
            </h1>
          </div>
        </div>
        <p className="text-body-lg">{c.placement.intro}</p>
        <ul className="flex flex-col gap-3">
          {TIPS.map((t) => (
            <li key={t.text} className="flex items-start gap-3 text-body">
              <span
                aria-hidden
                className="grid size-10 shrink-0 place-items-center rounded-md bg-blue-50 text-blue-strong [&_svg]:size-5"
              >
                {t.icon}
              </span>
              <span className="pt-2">{t.text}</span>
            </li>
          ))}
        </ul>
        <p className="rounded-md bg-surface-muted p-3 text-body-sm text-ink-muted">
          Kết quả là những quan sát ban đầu để gợi ý nơi bé nên bắt đầu. Hoạt
          động không cho điểm, không xếp loại và không liên quan đến yêu cầu
          tuyển sinh của trường nào.
        </p>
        {open && (
          <p className="text-body font-semibold">
            {child.nickname} đang làm dở: đã xong {open.currentIndex}/
            {open.total} câu.
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <LittleButton
            size="lg"
            iconStart={<Play />}
            onClick={() => go(false)}
          >
            {open
              ? "Chơi tiếp cùng bé"
              : done
                ? "Làm lại cùng bé"
                : "Bắt đầu cùng bé"}
          </LittleButton>
          {open && (
            <LittleButton
              size="lg"
              variant="secondary"
              iconStart={<RotateCcw />}
              onClick={() => go(true)}
            >
              Bắt đầu lại từ đầu
            </LittleButton>
          )}
        </div>
      </LittleCard>
      <div>
        <LittleLinkButton href={`/parent/child?id=${child.id}`} variant="ghost">
          Để sau
        </LittleLinkButton>
      </div>
    </div>
  );
}
