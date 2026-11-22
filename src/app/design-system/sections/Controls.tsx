"use client";

import {
  ArrowRight,
  Info,
  Plus,
  RotateCcw,
  Settings,
  Star,
  Trash2,
  Volume2,
} from "lucide-react";
import { useState } from "react";

import { AdminFormField } from "@/components/admin/AdminFormField";
import { AVATAR_KEYS, LittleAvatar } from "@/components/ui/LittleAvatar";
import {
  BADGE_TONES,
  type BadgeTone,
  LittleBadge,
} from "@/components/ui/LittleBadge";
import {
  BUTTON_SIZES,
  BUTTON_VARIANTS,
  type ButtonSize,
  type ButtonVariant,
  LittleButton,
} from "@/components/ui/LittleButton";
import { LittleCard, LittleSelectableCard } from "@/components/ui/LittleCard";
import { LittleDivider } from "@/components/ui/LittleDivider";
import { LittleIconButton } from "@/components/ui/LittleIconButton";
import { LittleInput, LittleSelect } from "@/components/ui/LittleInput";
import { LittleModal } from "@/components/ui/LittleModal";
import { LittleProgress } from "@/components/ui/LittleProgress";
import { LittleSpinner } from "@/components/ui/LittleSpinner";
import { LittleStatePanel } from "@/components/ui/LittleStatePanel";
import { LittleSwitch } from "@/components/ui/LittleSwitch";
import { LittleToast, useToast } from "@/components/ui/LittleToast";
import { LittleTooltip } from "@/components/ui/LittleTooltip";

import { Demo, Section } from "./Section";

const VARIANTS = Object.keys(BUTTON_VARIANTS) as ButtonVariant[];
const SIZES = Object.keys(BUTTON_SIZES) as ButtonSize[];

export function Controls() {
  return (
    <>
      <Buttons />
      <Cards />
      <Forms />
      <BadgesAndProgress />
      <Overlays />
    </>
  );
}

function Buttons() {
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(0);
  return (
    <Section
      id="buttons"
      title="Nút & trạng thái"
      intro="States: default, hover (pointer devices only), pressed (squash + shorter edge), focus (3 px ring — try Tab), disabled, loading. Child actions use lg (56 px) and xl (64 px)."
    >
      <Demo title="Variants">
        <div className="flex flex-wrap items-center gap-3">
          {VARIANTS.map((v) => (
            <LittleButton
              key={v}
              variant={v}
              onClick={() => setCount((c) => c + 1)}
            >
              {v}
            </LittleButton>
          ))}
        </div>
        <p aria-live="polite" className="mt-2 text-body-sm text-ink-muted">
          Đã bấm {count} lần.
        </p>
      </Demo>
      <Demo title="Sizes">
        <div className="flex flex-wrap items-end gap-3">
          {SIZES.map((s) => (
            <LittleButton key={s} size={s} iconEnd={<ArrowRight />}>
              {s}
            </LittleButton>
          ))}
        </div>
      </Demo>
      <Demo title="Disabled & loading">
        <div className="flex flex-wrap items-center gap-3">
          <LittleButton disabled>Không khả dụng</LittleButton>
          <LittleButton variant="secondary" disabled>
            Không khả dụng
          </LittleButton>
          <LittleButton
            loading={loading}
            onClick={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 1500);
            }}
          >
            Lưu thay đổi
          </LittleButton>
        </div>
      </Demo>
      <Demo
        title="Icon buttons"
        note="Always have an accessible name (shown as tooltip on desktop)."
      >
        <div className="flex flex-wrap items-center gap-3">
          <LittleIconButton
            label="Nghe lại"
            icon={<Volume2 />}
            variant="primary"
            size="xl"
          />
          <LittleIconButton label="Làm lại" icon={<RotateCcw />} size="lg" />
          <LittleIconButton
            label="Cài đặt"
            icon={<Settings />}
            variant="ghost"
          />
          <LittleIconButton
            label="Thêm"
            icon={<Plus />}
            variant="secondary"
            size="sm"
          />
          <LittleIconButton
            label="Xoá"
            icon={<Trash2 />}
            variant="danger"
            size="sm"
          />
          <LittleIconButton label="Không khả dụng" icon={<Star />} disabled />
        </div>
      </Demo>
    </Section>
  );
}

function Cards() {
  const [selected, setSelected] = useState("b");
  return (
    <Section
      id="cards"
      title="Thẻ & trạng thái"
      intro="Static cards hold content. Selectable cards add hover lift, selected (outline + tint + aria-pressed), pressed and disabled."
    >
      <Demo title="Surfaces">
        <div className="grid grid-cols-2 gap-4 tablet:grid-cols-4">
          {(
            [
              "surface",
              "muted",
              "blue",
              "yellow",
              "coral",
              "mint",
              "lavender",
              "canvas",
            ] as const
          ).map((s) => (
            <LittleCard
              key={s}
              surface={s}
              elevation={s === "canvas" ? "xs" : "sm"}
              padding="sm"
            >
              <p className="text-body font-bold">{s}</p>
              <p className="text-body-sm text-ink-muted">LittleCard</p>
            </LittleCard>
          ))}
        </div>
      </Demo>
      <Demo title="Selectable">
        <div
          role="group"
          aria-label="Chọn một gói"
          className="grid gap-4 tablet:grid-cols-3"
        >
          {[
            {
              id: "a",
              title: "10 phút mỗi ngày",
              text: "Phù hợp khi mới bắt đầu",
            },
            {
              id: "b",
              title: "15 phút mỗi ngày",
              text: "Khuyến nghị cho bé 5–6 tuổi",
            },
            {
              id: "c",
              title: "20 phút mỗi ngày",
              text: "Không khả dụng trong bản demo",
            },
          ].map((o) => (
            <LittleSelectableCard
              key={o.id}
              selected={selected === o.id}
              disabled={o.id === "c"}
              onClick={() => setSelected(o.id)}
            >
              <p className="text-h3">{o.title}</p>
              <p className="text-body-sm text-ink-muted">{o.text}</p>
            </LittleSelectableCard>
          ))}
        </div>
      </Demo>
    </Section>
  );
}

function Forms() {
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const [music, setMusic] = useState(false);
  const [captions, setCaptions] = useState(true);
  const error =
    touched && name.trim().length === 0
      ? "Vui lòng nhập tên gọi của bé."
      : undefined;
  return (
    <Section
      id="forms"
      title="Biểu mẫu"
      intro="Native controls styled with tokens. Borders meet 3:1; errors use text + icon, never colour alone."
    >
      <div className="grid gap-6 desktop:grid-cols-2">
        <LittleCard className="flex flex-col gap-4">
          <AdminFormField
            label="Tên gọi của bé"
            hint="Chỉ cần tên ở nhà, không cần họ."
            error={error}
            required
          >
            {(f) => (
              <LittleInput
                id={f.id}
                aria-describedby={f["aria-describedby"]}
                invalid={f.invalid}
                required={f.required}
                value={name}
                maxLength={20}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="Ví dụ: Bông"
              />
            )}
          </AdminFormField>
          <AdminFormField label="Thời gian học mỗi ngày">
            {(f) => (
              <LittleSelect
                id={f.id}
                aria-describedby={f["aria-describedby"]}
                defaultValue="15"
              >
                <option value="10">10 phút</option>
                <option value="15">15 phút</option>
                <option value="20">20 phút</option>
              </LittleSelect>
            )}
          </AdminFormField>
          <AdminFormField label="Ô bị khoá">
            {(f) => (
              <LittleInput id={f.id} disabled value="Không thể sửa" readOnly />
            )}
          </AdminFormField>
        </LittleCard>
        <LittleCard className="flex flex-col">
          <LittleSwitch
            checked={music}
            onCheckedChange={setMusic}
            label="Nhạc nền"
            description="Tắt theo mặc định để bé tập trung."
          />
          <LittleDivider />
          <LittleSwitch
            checked={captions}
            onCheckedChange={setCaptions}
            label="Phụ đề lời đọc"
            description="Hiện chữ cho lời của bạn Nắng."
          />
          <LittleDivider />
          <LittleSwitch
            checked={false}
            onCheckedChange={() => {}}
            label="Tải về để học offline"
            description="Chưa hỗ trợ."
            disabled
          />
        </LittleCard>
      </div>
    </Section>
  );
}

function BadgesAndProgress() {
  const [value, setValue] = useState(3);
  const toast = useToast();
  return (
    <Section id="badges" title="Huy hiệu, tiến độ & trạng thái tải">
      <Demo title="Badges">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(BADGE_TONES) as BadgeTone[]).map((t) => (
            <LittleBadge key={t} tone={t}>
              {t}
            </LittleBadge>
          ))}
          <LittleBadge tone="reward" icon={<Star />}>
            3 sao
          </LittleBadge>
          <LittleBadge tone="info" size="sm" icon={<Info />}>
            sm
          </LittleBadge>
        </div>
      </Demo>
      <Demo title="Progress">
        <div className="flex max-w-xl flex-col gap-4">
          <LittleProgress
            label="Hoàn thành tuần này"
            value={value}
            max={5}
            valueText={`${value}/5 bài`}
          />
          <LittleProgress
            label="Thế giới Số"
            value={60}
            tone="yellow"
            valueText="60%"
          />
          <LittleProgress
            label="Tiến độ tải nội dung"
            value={30}
            tone="mint"
            size="sm"
            hideLabel
          />
          <div className="flex gap-2">
            <LittleButton
              size="sm"
              variant="secondary"
              onClick={() => setValue((v) => Math.max(0, v - 1))}
            >
              Bớt
            </LittleButton>
            <LittleButton
              size="sm"
              variant="secondary"
              onClick={() => setValue((v) => Math.min(5, v + 1))}
            >
              Thêm
            </LittleButton>
          </div>
        </div>
      </Demo>
      <Demo title="Loading, empty and error states">
        <div className="grid gap-4 desktop:grid-cols-3">
          <LittleCard>
            <LittleStatePanel kind="loading" title="Đang tải bài học…" />
          </LittleCard>
          <LittleCard>
            <LittleStatePanel
              kind="empty"
              title="Chưa có hoạt động nào"
              description="Khi bé học bài đầu tiên, hoạt động sẽ hiện ở đây."
              action={
                <LittleButton
                  size="sm"
                  onClick={() =>
                    toast({
                      tone: "info",
                      title: "Demo: tạo hồ sơ bé sẽ có trong sprint Parent.",
                    })
                  }
                >
                  Thêm hồ sơ bé
                </LittleButton>
              }
            />
          </LittleCard>
          <LittleCard>
            <LittleStatePanel
              kind="error"
              title="Không tải được bài học"
              description="Có thể mạng đang chậm. Dữ liệu của bé vẫn an toàn."
              action={
                <LittleButton
                  size="sm"
                  iconStart={<RotateCcw />}
                  onClick={() =>
                    toast({ tone: "success", title: "Demo: đã thử tải lại." })
                  }
                >
                  Thử lại
                </LittleButton>
              }
            />
          </LittleCard>
        </div>
        <p className="mt-2 flex items-center gap-2 text-body-sm text-ink-muted">
          Inline spinner:{" "}
          <LittleSpinner className="text-blue-strong" label="Đang tải" />
        </p>
      </Demo>
    </Section>
  );
}

function Overlays() {
  const [open, setOpen] = useState(false);
  const [inlineToast, setInlineToast] = useState(true);
  const toast = useToast();
  return (
    <Section id="overlays" title="Modal, tooltip, toast, avatar">
      <Demo
        title="Modal"
        note="Focus is trapped; Escape or the close button dismisses; focus returns to the trigger."
      >
        <LittleButton variant="secondary" onClick={() => setOpen(true)}>
          Mở modal
        </LittleButton>
        <LittleModal
          open={open}
          onClose={() => setOpen(false)}
          title="Lưu tiến độ của bé?"
          description="Bạn có thể tiếp tục bài học sau, từ đúng câu đang làm."
          footer={
            <>
              <LittleButton variant="ghost" onClick={() => setOpen(false)}>
                Huỷ
              </LittleButton>
              <LittleButton onClick={() => setOpen(false)}>
                Lưu và thoát
              </LittleButton>
            </>
          }
        />
      </Demo>
      <Demo
        title="Tooltip"
        note="Hover or keyboard focus. Supplementary only — touch users may never see it."
      >
        <LittleTooltip content="Bé học được 15 phút mỗi ngày là phù hợp.">
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-pill px-3 text-body font-bold text-blue-strong hover:bg-blue-50"
          >
            <Info aria-hidden className="size-5" /> Thời gian khuyến nghị
          </button>
        </LittleTooltip>
      </Demo>
      <Demo title="Toast">
        <div className="flex flex-wrap gap-3">
          <LittleButton
            variant="success"
            onClick={() => toast({ tone: "success", title: "Đã lưu cài đặt" })}
          >
            Toast thành công
          </LittleButton>
          <LittleButton
            variant="secondary"
            onClick={() =>
              toast({
                tone: "error",
                title: "Không lưu được",
                description: "Mạng đang không ổn định.",
                action: {
                  label: "Thử lại",
                  onClick: () =>
                    toast({ tone: "info", title: "Đang thử lại…" }),
                },
              })
            }
          >
            Toast lỗi có hành động
          </LittleButton>
        </div>
        <div className="mt-4 flex flex-col items-start gap-2">
          {inlineToast ? (
            <LittleToast
              tone="warning"
              title="Sắp hết giờ học hôm nay"
              description="Còn 2 phút nữa bạn Nắng sẽ nhắc bé nghỉ."
              onDismiss={() => setInlineToast(false)}
            />
          ) : (
            <LittleButton
              size="sm"
              variant="ghost"
              onClick={() => setInlineToast(true)}
            >
              Hiện lại toast mẫu
            </LittleButton>
          )}
        </div>
      </Demo>
      <Demo
        title="Avatars"
        note="Children choose from a fixed catalogue (no photos). Adults fall back to initials."
      >
        <div className="flex flex-wrap items-center gap-3">
          {AVATAR_KEYS.map((a) => (
            <LittleAvatar key={a} name={`Avatar ${a}`} avatar={a} size="lg" />
          ))}
          <LittleAvatar name="Nguyễn Minh Anh" size="lg" />
          <LittleAvatar name="Trần Hà" size="md" />
          <LittleAvatar name="Lê" size="sm" />
        </div>
      </Demo>
    </Section>
  );
}
