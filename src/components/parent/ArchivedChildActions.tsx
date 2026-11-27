"use client";

import { RotateCcw, Trash2 } from "lucide-react";
import { useActionState, useState } from "react";

import { FormMessage, TextField } from "@/components/forms/FormBits";
import { LittleButton } from "@/components/ui/LittleButton";
import {
  deleteChildAction,
  restoreChildAction,
} from "@/features/family/actions";
import { IDLE } from "@/features/forms";

/** Restore an archived profile, or (owner only) delete it permanently. */
export function ArchivedChildActions({
  childId,
  nickname,
  canDelete,
}: {
  childId: string;
  nickname: string;
  canDelete: boolean;
}) {
  const [restoreState, restore, restoring] = useActionState(
    restoreChildAction.bind(null, childId),
    IDLE,
  );
  const [deleteState, remove, deleting] = useActionState(
    deleteChildAction.bind(null, childId),
    IDLE,
  );
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <form action={restore} className="flex flex-col gap-2">
        <FormMessage state={restoreState} />
        <div>
          <LittleButton
            type="submit"
            variant="secondary"
            iconStart={<RotateCcw />}
            loading={restoring}
          >
            Khôi phục hồ sơ
          </LittleButton>
        </div>
      </form>

      {canDelete &&
        (confirm ? (
          <form
            action={remove}
            role="group"
            aria-label="Xác nhận xoá vĩnh viễn"
            className="flex flex-col gap-3 rounded-md bg-error-50 p-4"
            noValidate
          >
            <p className="text-body font-bold text-error-strong">
              Xoá vĩnh viễn hồ sơ của {nickname} và toàn bộ kết quả học tập?
              Không thể hoàn tác.
            </p>
            <TextField
              label={`Gõ “${nickname}” để xác nhận`}
              name="confirm"
              state={deleteState}
              autoComplete="off"
              required
            />
            <FormMessage state={deleteState} />
            <div className="flex flex-wrap gap-2">
              <LittleButton
                type="submit"
                variant="danger"
                iconStart={<Trash2 />}
                loading={deleting}
              >
                Xoá vĩnh viễn
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
        ) : (
          <div>
            <LittleButton
              variant="ghost"
              iconStart={<Trash2 />}
              onClick={() => setConfirm(true)}
            >
              Xoá vĩnh viễn…
            </LittleButton>
          </div>
        ))}
    </div>
  );
}
