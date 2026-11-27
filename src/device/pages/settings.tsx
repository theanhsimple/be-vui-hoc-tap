"use client";

import { Download, ShieldCheck, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { FormMessage, TextField } from "@/components/forms/FormBits";
import { LittleButton } from "@/components/ui/LittleButton";
import { LittleCard } from "@/components/ui/LittleCard";
import { LittleStatePanel } from "@/components/ui/LittleStatePanel";
import { type FormState, formError, IDLE } from "@/features/forms";
import { formatWhen } from "@/features/parent/report-model";

import {
  backupFile,
  eraseDevice,
  restoreBackup,
  useDeviceState,
} from "../store";

function download(name: string, text: string) {
  const url = URL.createObjectURL(
    new Blob([text], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Device edition settings: backup, restore, erase, install help. */
export function DeviceSettings() {
  const router = useRouter();
  const state = useDeviceState();
  const file = useRef<HTMLInputElement>(null);
  const [restoreState, setRestoreState] = useState<FormState>(IDLE);
  const [eraseOpen, setEraseOpen] = useState(false);
  const [eraseState, setEraseState] = useState<FormState>(IDLE);
  if (!state) return <LittleStatePanel kind="loading" />;
  const lessons = state.sessions.filter((s) => s.status === "completed").length;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <h1 className="text-display">Cài đặt</h1>

      <LittleCard padding="lg" className="flex flex-col gap-4">
        <div>
          <h2 className="text-h2">Sao lưu kết quả học</h2>
          <p className="text-body text-ink-muted">
            Phiên bản này lưu mọi thứ ngay trên thiết bị, không có tài khoản và
            không gửi dữ liệu đi đâu. Nếu xoá dữ liệu trình duyệt hoặc đổi máy,
            kết quả sẽ mất — hãy tải tệp sao lưu định kỳ.
          </p>
        </div>
        <p className="text-body">
          Đang lưu: {state.children.length} hồ sơ · {lessons} bài đã học ·{" "}
          {state.lastBackupAt
            ? `sao lưu lần cuối ${formatWhen(state.lastBackupAt, new Date()).toLowerCase()}`
            : "chưa sao lưu lần nào"}
          .
        </p>
        <div className="flex flex-wrap gap-3">
          <LittleButton
            iconStart={<Download />}
            onClick={() => {
              const f = backupFile();
              download(f.name, f.json);
            }}
          >
            Tải tệp sao lưu
          </LittleButton>
          <LittleButton
            variant="secondary"
            iconStart={<Upload />}
            onClick={() => file.current?.click()}
          >
            Khôi phục từ tệp
          </LittleButton>
          <input
            ref={file}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            tabIndex={-1}
            aria-label="Chọn tệp sao lưu"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              if (
                state.children.length > 0 &&
                !window.confirm(
                  "Khôi phục sẽ thay toàn bộ dữ liệu hiện có trên thiết bị bằng dữ liệu trong tệp. Tiếp tục?",
                )
              )
                return;
              const r = restoreBackup(await f.text());
              if (r.ok) router.push("/parent?saved=restoredBackup");
              else
                setRestoreState(
                  formError(
                    "Tệp này không phải tệp sao lưu của little hoặc đã bị hỏng.",
                  ),
                );
            }}
          />
        </div>
        <FormMessage state={restoreState} />
      </LittleCard>

      <LittleCard padding="lg" className="flex flex-col gap-3">
        <h2 className="text-h2">Mở như một ứng dụng trên iPad</h2>
        <ol className="list-decimal pl-5 text-body">
          <li>Mở trang này bằng Safari.</li>
          <li>Bấm nút Chia sẻ (ô vuông có mũi tên lên).</li>
          <li>Chọn “Thêm vào MH chính” rồi bấm “Thêm”.</li>
        </ol>
        <p className="text-body text-ink-muted">
          Bé sẽ mở little bằng biểu tượng trên màn hình chính, toàn màn hình.
          Cách này cũng giúp Safari giữ dữ liệu lâu hơn.
        </p>
      </LittleCard>

      <LittleCard padding="lg" className="flex flex-col gap-3">
        <h2 className="text-h2">Quyền riêng tư</h2>
        <p className="flex items-center gap-2 text-body">
          <ShieldCheck aria-hidden className="size-5 text-success-strong" />
          <Link
            href="/privacy"
            className="inline-flex min-h-11 items-center font-bold text-blue-strong underline underline-offset-4"
          >
            Dữ liệu của bé được lưu ở đâu
          </Link>
        </p>
      </LittleCard>

      <LittleCard padding="lg" className="flex flex-col gap-3">
        <h2 className="text-h2">Xoá toàn bộ dữ liệu</h2>
        <p className="text-body text-ink-muted">
          Xoá mọi hồ sơ và kết quả học trên thiết bị này. Không thể hoàn tác.
        </p>
        {eraseOpen ? (
          <form
            role="group"
            aria-label="Xác nhận xoá toàn bộ dữ liệu"
            className="flex flex-col gap-3 rounded-md bg-error-50 p-4"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              const v = String(
                new FormData(e.currentTarget).get("confirm") ?? "",
              ).trim();
              if (v !== "XOA") {
                setEraseState(
                  formError("Hãy gõ đúng XOA (chữ in hoa) để xác nhận.", {
                    confirm: v,
                  }),
                );
                return;
              }
              eraseDevice();
              router.push("/parent?saved=erased");
            }}
          >
            <TextField
              label="Gõ “XOA” để xác nhận"
              name="confirm"
              autoComplete="off"
              required
              state={eraseState}
            />
            <FormMessage state={eraseState} />
            <div className="flex flex-wrap gap-2">
              <LittleButton
                type="submit"
                variant="danger"
                iconStart={<Trash2 />}
              >
                Xoá toàn bộ
              </LittleButton>
              <LittleButton
                type="button"
                variant="ghost"
                onClick={() => setEraseOpen(false)}
              >
                Huỷ
              </LittleButton>
            </div>
          </form>
        ) : (
          <div>
            <LittleButton
              variant="secondary"
              iconStart={<Trash2 />}
              onClick={() => setEraseOpen(true)}
            >
              Xoá toàn bộ dữ liệu…
            </LittleButton>
          </div>
        )}
      </LittleCard>
    </div>
  );
}
