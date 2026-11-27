"use client";

import { useActionState, useState } from "react";

import { AdminFormField } from "@/components/admin/AdminFormField";
import { FormMessage, TextField } from "@/components/forms/FormBits";
import {
  AVATAR_KEYS,
  type AvatarKey,
  LittleAvatar,
} from "@/components/ui/LittleAvatar";
import { LittleButton } from "@/components/ui/LittleButton";
import { LittleSelect } from "@/components/ui/LittleInput";
import { LittleSwitch } from "@/components/ui/LittleSwitch";
import { SESSION_MINUTE_OPTIONS } from "@/features/family/schemas";
import type { FormState } from "@/features/forms";
import { IDLE } from "@/features/forms";
import { cn } from "@/lib/cn";

const AVATAR_NAMES: Record<AvatarKey, string> = {
  sun: "Mặt trời",
  cloud: "Đám mây",
  leaf: "Chiếc lá",
  flower: "Bông hoa",
  moon: "Mặt trăng",
  drop: "Giọt nước",
};

export interface ChildFormValues {
  nickname: string;
  avatar: AvatarKey;
  birthYear: number | null;
  voice: boolean;
  sounds: boolean;
  sessionMinutes: number | null;
}

/** Create / edit a child profile. Collects only what learning needs. */
export function ChildForm({
  action: serverAction,
  initial,
  submitLabel,
  currentYear,
  onboarding,
}: {
  action: (prev: FormState, form: FormData) => Promise<FormState>;
  initial?: ChildFormValues;
  submitLabel: string;
  currentYear: number;
  /** Creating the first child during onboarding (continues to the placement activity). */
  onboarding?: boolean;
}) {
  const [state, action, pending] = useActionState(serverAction, IDLE);
  const [avatar, setAvatar] = useState<AvatarKey>(initial?.avatar ?? "sun");
  const [voice, setVoice] = useState(initial?.voice ?? true);
  const [sounds, setSounds] = useState(initial?.sounds ?? true);
  const years = Array.from({ length: 9 }, (_, i) => currentYear - 3 - i);

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {onboarding && <input type="hidden" name="onboarding" value="1" />}
      <TextField
        label="Tên gọi của bé"
        name="nickname"
        hint="Biệt danh bé thích, tối đa 20 ký tự. Không cần họ tên đầy đủ."
        defaultValue={initial?.nickname}
        maxLength={20}
        required
        state={state}
      />

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-body-sm font-bold">Hình đại diện</legend>
        <input type="hidden" name="avatar" value={avatar} />
        <div
          className="grid grid-cols-3 gap-3 tablet:grid-cols-6"
          role="radiogroup"
        >
          {AVATAR_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={avatar === key}
              aria-label={AVATAR_NAMES[key]}
              onClick={() => setAvatar(key)}
              className={cn(
                "flex min-h-11 flex-col items-center gap-1 rounded-md border-2 p-2 text-body-sm font-bold",
                avatar === key
                  ? "border-blue-strong bg-blue-50"
                  : "border-transparent bg-surface-muted hover:border-border-strong",
              )}
            >
              <LittleAvatar
                name={AVATAR_NAMES[key]}
                avatar={key}
                size="lg"
                decorative
              />
              {AVATAR_NAMES[key]}
            </button>
          ))}
        </div>
        {state.fieldErrors?.avatar && (
          <p className="text-body-sm font-semibold text-error-strong">
            {state.fieldErrors.avatar}
          </p>
        )}
      </fieldset>

      <AdminFormField
        label="Năm sinh (không bắt buộc)"
        hint="Chỉ dùng để gợi ý bài phù hợp. Chúng tôi không lưu ngày sinh."
        error={state.fieldErrors?.birthYear}
      >
        {(control) => (
          <LittleSelect
            id={control.id}
            aria-describedby={control["aria-describedby"]}
            invalid={control.invalid}
            name="birthYear"
            key={state.values?.birthYear ?? "initial"}
            defaultValue={state.values?.birthYear ?? initial?.birthYear ?? ""}
          >
            <option value="">Không cung cấp</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </LittleSelect>
        )}
      </AdminFormField>

      <AdminFormField
        label="Nhắc bé nghỉ sau"
        hint="little sẽ nhắc bé nghỉ mắt khi đã học đủ thời gian này. Bố mẹ có thể cho bé học tiếp."
        error={state.fieldErrors?.sessionMinutes}
      >
        {(control) => (
          <LittleSelect
            id={control.id}
            aria-describedby={control["aria-describedby"]}
            invalid={control.invalid}
            name="sessionMinutes"
            key={state.values?.sessionMinutes ?? "initial-minutes"}
            defaultValue={
              state.values?.sessionMinutes ??
              (initial ? String(initial.sessionMinutes ?? "") : "20")
            }
          >
            <option value="">Không nhắc</option>
            {SESSION_MINUTE_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m} phút
              </option>
            ))}
          </LittleSelect>
        )}
      </AdminFormField>

      <div className="flex flex-col gap-1 rounded-md bg-surface-muted px-4 py-2">
        <input
          type="hidden"
          name="voice"
          value={voice ? "on" : ""}
          disabled={!voice}
        />
        <input
          type="hidden"
          name="sounds"
          value={sounds ? "on" : ""}
          disabled={!sounds}
        />
        <LittleSwitch
          label="Đọc hướng dẫn bằng giọng nói"
          description="Bé nghe câu hỏi và lời khen."
          checked={voice}
          onCheckedChange={setVoice}
        />
        <LittleSwitch
          label="Âm thanh hiệu ứng"
          description="Tiếng chạm, tiếng chúc mừng ngắn."
          checked={sounds}
          onCheckedChange={setSounds}
        />
      </div>

      <FormMessage state={state} />
      <LittleButton type="submit" size="lg" loading={pending}>
        {submitLabel}
      </LittleButton>
    </form>
  );
}
