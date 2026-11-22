"use client";

import { RotateCcw } from "lucide-react";
import { useEffect } from "react";

import { LittleButton } from "@/components/ui/LittleButton";
import { LittleStatePanel } from "@/components/ui/LittleStatePanel";

export default function ParentError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <LittleStatePanel
      kind="error"
      title="Chưa tải được dữ liệu"
      description="Có lỗi khi kết nối máy chủ. Vui lòng thử lại."
      action={
        <LittleButton iconStart={<RotateCcw />} onClick={() => retry()}>
          Thử lại
        </LittleButton>
      }
    />
  );
}
