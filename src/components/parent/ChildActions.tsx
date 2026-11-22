"use client";

import { Archive, Gamepad2 } from "lucide-react";
import { useActionState, useState, useTransition } from "react";

import { LittleButton } from "@/components/ui/LittleButton";
import {
  archiveChildAction,
  selectChildAction,
} from "@/features/family/actions";
import { IDLE } from "@/features/forms";

/** "Let this child learn now": selects the profile and opens the child area. */
export function StartLearningButton({
  childId,
  nickname,
}: {
  childId: string;
  nickname: string;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <LittleButton
        size="md"
        iconStart={<Gamepad2 />}
        loading={pending}
        aria-label={`Cho ${nickname} học`}
        onClick={() =>
          start(async () => {
            const r = await selectChildAction(childId);
            if (r && !r.ok) setError(r.message);
          })
        }
      >
        Cho bé học
      </LittleButton>
      {error && (
        <p
          role="alert"
          className="w-full text-body-sm font-semibold text-error-strong"
        >
          {error}
        </p>
      )}
    </>
  );
}

/** Archive with an explicit confirmation step. History is kept. */
export function ArchiveChild({
  childId,
  nickname,
}: {
  childId: string;
  nickname: string;
}) {
  const [confirm, setConfirm] = useState(false);
  const [state, action, pending] = useActionState(
    archiveChildAction.bind(null, childId),
    IDLE,
  );
  if (!confirm) {
    return (
      <LittleButton
        variant="secondary"
        iconStart={<Archive />}
        onClick={() => setConfirm(true)}
      >
        Lưu trữ hồ sơ
      </LittleButton>
    );
  }
  return (
    <form
      action={action}
      role="group"
      aria-label="Xác nhận lưu trữ"
      className="flex flex-col gap-3 rounded-md bg-warning-50 p-4"
    >
      <p className="text-body font-bold text-warning-strong">
        Lưu trữ hồ sơ của {nickname}? Bé sẽ không còn trong danh sách chọn bé.
        Kết quả học tập vẫn được giữ lại.
      </p>
      {state.message && (
        <p
          role="alert"
          className="text-body-sm font-semibold text-error-strong"
        >
          {state.message}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <LittleButton type="submit" variant="danger" loading={pending}>
          Lưu trữ
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
  );
}
