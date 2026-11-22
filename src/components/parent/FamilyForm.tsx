"use client";

import { useActionState } from "react";

import { FormMessage, TextField } from "@/components/forms/FormBits";
import { LittleButton } from "@/components/ui/LittleButton";
import { createFamilyAction } from "@/features/family/actions";
import { IDLE } from "@/features/forms";

/** First step after sign-up: the family's private space + guardian consent. */
export function FamilyForm() {
  const [state, action, pending] = useActionState(createFamilyAction, IDLE);
  const consentError = state.fieldErrors?.consent;
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <TextField
        label="Tên gia đình"
        name="displayName"
        placeholder="Ví dụ: Nhà Mầm"
        maxLength={60}
        required
        state={state}
      />
      <div className="flex flex-col gap-2 rounded-md bg-surface-muted p-4">
        <p className="text-body font-bold">Thông tin chúng tôi lưu về bé</p>
        <ul className="list-disc pl-5 text-body-sm text-ink-muted">
          <li>
            Tên gọi (biệt danh), hình đại diện chọn sẵn, năm sinh (không bắt
            buộc).
          </li>
          <li>
            Kết quả học tập: bài đã học, câu trả lời, ngôi sao và huy hiệu.
          </li>
          <li>
            Không cần email, mật khẩu hay ảnh của bé. Không quảng cáo, không
            bảng xếp hạng.
          </li>
        </ul>
        <label className="mt-2 flex min-h-11 items-start gap-3 text-body">
          <input
            type="checkbox"
            name="consent"
            className="mt-1 size-5 accent-blue-strong"
            aria-invalid={consentError ? true : undefined}
            aria-describedby={consentError ? "consent-error" : undefined}
          />
          <span>
            Tôi là bố mẹ hoặc người giám hộ hợp pháp của bé và đồng ý cho little
            lưu các thông tin trên để bé học tập.
          </span>
        </label>
        {consentError && (
          <p
            id="consent-error"
            className="text-body-sm font-semibold text-error-strong"
          >
            {consentError}
          </p>
        )}
      </div>
      <FormMessage state={state} />
      <LittleButton type="submit" size="lg" loading={pending}>
        Tạo gia đình
      </LittleButton>
    </form>
  );
}
