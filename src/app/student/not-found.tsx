import { House } from "lucide-react";

import { StudentShell } from "@/components/layout/StudentShell";
import { LittleMascot } from "@/components/learning/LittleMascot";
import { LittleLinkButton } from "@/components/ui/LittleLinkButton";

export default function StudentNotFound() {
  return (
    <StudentShell>
      <div className="flex flex-col items-center gap-4 text-center">
        <LittleMascot state="think" className="size-32" />
        <h1 className="text-display">Ôi, mình lạc đường rồi!</h1>
        <p className="text-h3 text-ink-muted">
          Không tìm thấy nơi này. Mình cùng về nhà nhé.
        </p>
        <LittleLinkButton href="/student/home" size="xl" iconStart={<House />}>
          Về trang chủ
        </LittleLinkButton>
      </div>
    </StudentShell>
  );
}
