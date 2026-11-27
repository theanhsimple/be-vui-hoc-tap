"use client";

import { Copy, LogOut, Trash2, UserMinus, UserPlus, X } from "lucide-react";
import { useActionState, useState } from "react";

import { FormMessage, TextField } from "@/components/forms/FormBits";
import { LittleButton } from "@/components/ui/LittleButton";
import { IDLE, type FormState } from "@/features/forms";
import {
  createInviteAction,
  deleteAccountAction,
  deleteFamilyAction,
  type InviteState,
  leaveFamilyAction,
  removeMemberAction,
  revokeInviteAction,
  updateFamilyNameAction,
} from "@/features/family/settings-actions";

export function FamilyNameForm({ name }: { name: string }) {
  const [state, action, pending] = useActionState(updateFamilyNameAction, IDLE);
  return (
    <form action={action} className="flex flex-col gap-3" noValidate>
      <TextField
        label="Tên gia đình"
        name="displayName"
        defaultValue={name}
        maxLength={60}
        required
        state={state}
      />
      <FormMessage state={state} />
      <div>
        <LittleButton type="submit" variant="secondary" loading={pending}>
          Lưu tên
        </LittleButton>
      </div>
    </form>
  );
}

/** Creates a one-time code and shows it ONCE (only a hash is stored). */
export function InvitePanel() {
  const [state, action, pending] = useActionState<InviteState, FormData>(
    createInviteAction,
    IDLE,
  );
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      {state.code ? (
        <div
          role="status"
          className="flex flex-col gap-2 rounded-md bg-success-50 p-4"
        >
          <p className="text-body font-bold text-success-strong">
            Mã mời mới (chỉ hiện một lần):
          </p>
          <p className="font-mono text-h2 tracking-widest" translate="no">
            {state.code}
          </p>
          <p className="text-body-sm">
            Gửi mã này cho người giám hộ thứ hai. Họ tạo tài khoản little, rồi
            chọn “Tham gia bằng mã mời”. Mã dùng được một lần, hết hạn sau 7
            ngày.
          </p>
          <div>
            <LittleButton
              size="sm"
              variant="secondary"
              iconStart={<Copy />}
              onClick={() => {
                void navigator.clipboard
                  ?.writeText(state.code!)
                  .then(() => setCopied(true))
                  .catch(() => setCopied(false));
              }}
            >
              {copied ? "Đã sao chép" : "Sao chép mã"}
            </LittleButton>
          </div>
        </div>
      ) : (
        <FormMessage state={state} />
      )}
      <form action={action}>
        <LittleButton
          type="submit"
          variant="secondary"
          iconStart={<UserPlus />}
          loading={pending}
        >
          Tạo mã mời
        </LittleButton>
      </form>
    </div>
  );
}

function SmallAction({
  action,
  label,
  icon,
  ariaLabel,
}: {
  action: (prev: FormState, form: FormData) => Promise<FormState>;
  label: string;
  icon: React.ReactNode;
  ariaLabel: string;
}) {
  const [state, run, pending] = useActionState(action, IDLE);
  return (
    <form action={run} className="flex flex-col items-end gap-1">
      <LittleButton
        type="submit"
        size="sm"
        variant="ghost"
        iconStart={icon}
        loading={pending}
        aria-label={ariaLabel}
      >
        {label}
      </LittleButton>
      {state.message && (
        <p
          role="alert"
          className="text-body-sm font-semibold text-error-strong"
        >
          {state.message}
        </p>
      )}
    </form>
  );
}

export function RevokeInvite({ id, label }: { id: string; label: string }) {
  return (
    <SmallAction
      action={revokeInviteAction.bind(null, id)}
      label="Huỷ mã"
      icon={<X />}
      ariaLabel={`Huỷ ${label}`}
    />
  );
}

export function RemoveMember({
  userId,
  name,
}: {
  userId: string;
  name: string;
}) {
  return (
    <SmallAction
      action={removeMemberAction.bind(null, userId)}
      label="Gỡ"
      icon={<UserMinus />}
      ariaLabel={`Gỡ ${name} khỏi gia đình`}
    />
  );
}

export function LeaveFamily() {
  return (
    <SmallAction
      action={leaveFamilyAction}
      label="Rời gia đình"
      icon={<LogOut />}
      ariaLabel="Rời gia đình này"
    />
  );
}

/** A destructive step behind an explicit, typed confirmation. */
function TypedConfirm({
  kind,
  expected,
  title,
  description,
  button,
}: {
  kind: "family" | "account";
  expected: string;
  title: string;
  description: string;
  button: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    kind === "family" ? deleteFamilyAction : deleteAccountAction,
    IDLE,
  );
  if (!open)
    return (
      <div>
        <LittleButton
          variant="secondary"
          iconStart={<Trash2 />}
          onClick={() => setOpen(true)}
        >
          {button}…
        </LittleButton>
      </div>
    );
  return (
    <form
      action={action}
      role="group"
      aria-label={title}
      className="flex flex-col gap-3 rounded-md bg-error-50 p-4"
      noValidate
    >
      <p className="text-body font-bold text-error-strong">{title}</p>
      <p className="text-body">{description}</p>
      <TextField
        label={`Gõ “${expected}” để xác nhận`}
        name="confirm"
        autoComplete="off"
        required
        state={state}
      />
      <FormMessage state={state} />
      <div className="flex flex-wrap gap-2">
        <LittleButton
          type="submit"
          variant="danger"
          iconStart={<Trash2 />}
          loading={pending}
        >
          {button}
        </LittleButton>
        <LittleButton
          type="button"
          variant="ghost"
          onClick={() => setOpen(false)}
        >
          Huỷ
        </LittleButton>
      </div>
    </form>
  );
}

export function DeleteFamily({ name }: { name: string }) {
  return (
    <TypedConfirm
      kind="family"
      expected={name}
      title="Xoá gia đình và toàn bộ dữ liệu của các bé?"
      description="Mọi hồ sơ bé, bài đã học, câu trả lời, ngôi sao, huy hiệu, mã mời và thành viên sẽ bị xoá vĩnh viễn. Tài khoản của bạn vẫn còn. Không thể hoàn tác. Bố mẹ nên tải dữ liệu về trước."
      button="Xoá gia đình"
    />
  );
}

export function DeleteAccount({
  expected,
  isOwner,
}: {
  expected: string;
  isOwner: boolean;
}) {
  return (
    <TypedConfirm
      kind="account"
      expected={expected}
      title="Xoá tài khoản của bạn?"
      description={
        isOwner
          ? "Tài khoản, gia đình và toàn bộ dữ liệu học tập của các bé sẽ bị xoá vĩnh viễn. Người giám hộ khác cũng mất quyền truy cập. Không thể hoàn tác."
          : "Tài khoản của bạn sẽ bị xoá và bạn rời khỏi gia đình. Dữ liệu của các bé vẫn được giữ cho chủ gia đình."
      }
      button="Xoá tài khoản"
    />
  );
}
