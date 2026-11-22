"use client";

import { LayoutDashboard, LogOut, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { signOutAction } from "@/features/auth/actions";
import { leaveStudentAction } from "@/features/family/actions";

import { LittleButton } from "../ui/LittleButton";
import { LittleModal } from "../ui/LittleModal";

/** Shown after the parent gate: the only exits from the child area. */
export function ParentPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <LittleModal
      open={open}
      onClose={onClose}
      eyebrow="Dành cho bố mẹ"
      title="Khu vực phụ huynh"
      description="Quản lý hồ sơ của bé, đổi bé đang học hoặc đăng xuất."
      footer={
        <LittleButton variant="ghost" onClick={onClose}>
          Đóng
        </LittleButton>
      }
    >
      <div className="flex flex-col gap-3">
        <LittleButton
          variant="primary"
          iconStart={<LayoutDashboard />}
          fullWidth
          onClick={() => {
            onClose();
            router.push("/parent");
          }}
        >
          Mở khu vực phụ huynh
        </LittleButton>
        <LittleButton
          variant="secondary"
          iconStart={<Users />}
          fullWidth
          loading={pending}
          onClick={() => start(() => leaveStudentAction())}
        >
          Đổi bé đang học
        </LittleButton>
        <LittleButton
          variant="ghost"
          iconStart={<LogOut />}
          fullWidth
          loading={pending}
          onClick={() => start(() => signOutAction())}
        >
          Đăng xuất
        </LittleButton>
      </div>
    </LittleModal>
  );
}
