import { Download, KeyRound, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ParentFrame } from "@/components/parent/ParentFrame";
import {
  DeleteAccount,
  DeleteFamily,
  FamilyNameForm,
  InvitePanel,
  LeaveFamily,
  RemoveMember,
  RevokeInvite,
} from "@/components/parent/SettingsForms";
import { LittleBadge } from "@/components/ui/LittleBadge";
import { BUTTON_SIZES, BUTTON_VARIANTS } from "@/components/ui/buttonStyles";
import { LittleCard } from "@/components/ui/LittleCard";
import { LittleLinkButton } from "@/components/ui/LittleLinkButton";
import { LittleStatePanel } from "@/components/ui/LittleStatePanel";
import {
  listMembers,
  listOpenInvites,
  requireFamily,
} from "@/features/family/queries";
import { formatWhen } from "@/features/parent/report-model";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Cài đặt" };

const SAVED: Record<string, string> = {
  "invite-revoked": "Đã huỷ mã mời.",
  "member-removed": "Đã gỡ người giám hộ khỏi gia đình.",
};

export default function SettingsPage(props: PageProps<"/parent/settings">) {
  return (
    <ParentFrame currentId="settings">
      <Suspense fallback={<LittleStatePanel kind="loading" />}>
        <Settings {...props} />
      </Suspense>
    </ParentFrame>
  );
}

async function Settings({ searchParams }: PageProps<"/parent/settings">) {
  const { family, user } = await requireFamily("/parent/settings");
  const owner = family.role === "owner";
  const [members, invites, { saved }] = await Promise.all([
    listMembers(family.id),
    owner ? listOpenInvites(family.id) : Promise.resolve([]),
    searchParams,
  ]);
  const notice = typeof saved === "string" ? SAVED[saved] : undefined;
  const now = new Date();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <p className="text-body-sm font-bold text-ink-muted">
          {family.displayName}
        </p>
        <h1 className="text-display">Cài đặt</h1>
      </div>
      {notice && (
        <p
          role="status"
          className="rounded-md bg-success-50 p-3 text-body font-semibold text-success-strong"
        >
          {notice}
        </p>
      )}

      {owner && (
        <LittleCard padding="lg" className="flex flex-col gap-4">
          <h2 className="text-h2">Gia đình</h2>
          <FamilyNameForm name={family.displayName} />
        </LittleCard>
      )}

      <LittleCard padding="lg" className="flex flex-col gap-4">
        <div>
          <h2 className="text-h2">Người giám hộ</h2>
          <p className="text-body text-ink-muted">
            Người giám hộ xem được tiến độ và quản lý hồ sơ của các bé. Chỉ chủ
            gia đình mới mời, gỡ người khác hoặc xoá dữ liệu.
          </p>
        </div>
        <ul className="flex flex-col divide-y divide-border">
          {members.map((m) => {
            const name =
              m.displayName ?? (m.isMe ? user.email : "Người giám hộ");
            return (
              <li
                key={m.userId}
                className="flex flex-wrap items-center justify-between gap-2 py-3"
              >
                <div className="min-w-0">
                  <p className="text-body font-bold">
                    {name}
                    {m.isMe && (
                      <span className="font-normal text-ink-muted"> (bạn)</span>
                    )}
                  </p>
                  <LittleBadge
                    tone={m.role === "owner" ? "info" : "neutral"}
                    size="sm"
                  >
                    {m.role === "owner" ? "Chủ gia đình" : "Người giám hộ"}
                  </LittleBadge>
                </div>
                {owner && m.role === "guardian" && (
                  <RemoveMember userId={m.userId} name={name ?? "người này"} />
                )}
                {!owner && m.isMe && <LeaveFamily />}
              </li>
            );
          })}
        </ul>
        {owner && (
          <>
            {invites.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="text-h3">Mã mời đang chờ</h3>
                <ul className="flex flex-col divide-y divide-border">
                  {invites.map((i, n) => (
                    <li
                      key={i.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-2"
                    >
                      <p className="text-body">
                        Mã tạo {formatWhen(i.createdAt, now).toLowerCase()} ·
                        hết hạn {formatWhen(i.expiresAt, now).toLowerCase()}
                      </p>
                      <RevokeInvite id={i.id} label={`mã mời số ${n + 1}`} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <InvitePanel />
          </>
        )}
      </LittleCard>

      <LittleCard padding="lg" className="flex flex-col gap-4">
        <h2 className="text-h2">Tài khoản & quyền riêng tư</h2>
        <div className="flex flex-wrap gap-3">
          <LittleLinkButton
            href="/auth/reset-password"
            variant="secondary"
            iconStart={<KeyRound />}
          >
            Đổi mật khẩu
          </LittleLinkButton>
          {/* A plain download link (a file, not a page): same look as LittleLinkButton. */}
          <a
            href="/parent/settings/export"
            download
            className={cn(
              "inline-flex items-center justify-center text-center leading-tight select-none active:translate-y-0.5 active:edge-3d-pressed",
              BUTTON_VARIANTS.secondary,
              BUTTON_SIZES.md,
            )}
          >
            <Download aria-hidden />
            <span>Tải dữ liệu gia đình (JSON)</span>
          </a>
        </div>
        <p className="text-body-sm text-ink-muted">
          Tệp tải về gồm hồ sơ các bé, bài đã học, câu trả lời, ngôi sao, huy
          hiệu và kết quả hoạt động khám phá của gia đình bạn.
        </p>
        <p className="flex items-center gap-2 text-body">
          <ShieldCheck aria-hidden className="size-5 text-success-strong" />
          <Link
            href="/privacy"
            className="inline-flex min-h-11 items-center font-bold text-blue-strong underline underline-offset-4"
          >
            Chính sách quyền riêng tư (bản nháp)
          </Link>
        </p>
      </LittleCard>

      <LittleCard padding="lg" className="flex flex-col gap-4">
        <h2 className="text-h2">Xoá dữ liệu</h2>
        {owner && (
          <div className="flex flex-col gap-2">
            <h3 className="text-h3">Xoá gia đình</h3>
            <p className="text-body text-ink-muted">
              Xoá vĩnh viễn mọi hồ sơ bé và dữ liệu học tập. Tài khoản của bạn
              vẫn còn.
            </p>
            <DeleteFamily name={family.displayName} />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <h3 className="text-h3">Xoá tài khoản</h3>
          <p className="text-body text-ink-muted">
            {owner
              ? "Xoá tài khoản cùng gia đình và toàn bộ dữ liệu của các bé."
              : "Xoá tài khoản của bạn. Dữ liệu của các bé vẫn thuộc về gia đình."}
          </p>
          <DeleteAccount expected={family.displayName} isOwner={owner} />
        </div>
      </LittleCard>
    </div>
  );
}
