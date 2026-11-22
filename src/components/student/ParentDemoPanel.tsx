"use client";

import { RotateCcw, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { demoStore } from "@/features/learning/store/demoStore";

import { LittleButton } from "../ui/LittleButton";
import { LittleModal } from "../ui/LittleModal";

/**
 * What a parent sees after passing the gate in the demo. The real parent
 * area (dashboard, profiles, settings) is built in Sprint 05.
 */
export function ParentDemoPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <LittleModal
      open={open}
      onClose={() => {
        setConfirmReset(false);
        onClose();
      }}
      eyebrow="Dành cho bố mẹ · bản demo"
      title="Khu vực phụ huynh"
      description="Bảng theo dõi, hồ sơ bé và cài đặt sẽ có trong phiên bản tiếp theo. Tiến độ demo hiện chỉ lưu trên thiết bị này."
      footer={
        <LittleButton variant="ghost" onClick={onClose}>
          Đóng
        </LittleButton>
      }
    >
      <div className="flex flex-col gap-3">
        <LittleButton
          variant="secondary"
          iconStart={<Users />}
          fullWidth
          onClick={() => {
            demoStore.selectChild(null);
            onClose();
            router.push("/student/profiles");
          }}
        >
          Đổi bé đang học
        </LittleButton>
        {confirmReset ? (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-md bg-warning-50 p-4"
          >
            <p className="text-body font-bold text-warning-strong">
              Xoá toàn bộ tiến độ demo của các bé trên thiết bị này?
            </p>
            <div className="flex flex-wrap gap-2">
              <LittleButton
                variant="danger"
                onClick={() => {
                  demoStore.reset();
                  setConfirmReset(false);
                  onClose();
                  router.push("/student/welcome");
                }}
              >
                Xoá và bắt đầu lại
              </LittleButton>
              <LittleButton
                variant="ghost"
                onClick={() => setConfirmReset(false)}
              >
                Huỷ
              </LittleButton>
            </div>
          </div>
        ) : (
          <LittleButton
            variant="secondary"
            iconStart={<RotateCcw />}
            fullWidth
            onClick={() => setConfirmReset(true)}
          >
            Đặt lại dữ liệu demo
          </LittleButton>
        )}
      </div>
    </LittleModal>
  );
}
