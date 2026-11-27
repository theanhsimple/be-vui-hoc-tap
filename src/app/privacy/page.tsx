import type { Metadata } from "next";

import { Logo } from "@/components/layout/Logo";
import { LittleCard } from "@/components/ui/LittleCard";
import { LittleLinkButton } from "@/components/ui/LittleLinkButton";

export const metadata: Metadata = {
  title: "Quyền riêng tư (bản nháp)",
  robots: { index: false, follow: false },
};

/**
 * DRAFT privacy notice. It only describes what the product does today; it is
 * pending legal review (PRD §7: Decree 13/2023/ND-CP and the Personal Data
 * Protection Law) and must not be presented as final.
 */
export default function PrivacyPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-8">
      <Logo className="text-h1" />
      <p
        role="note"
        className="rounded-md bg-warning-50 p-4 text-body font-bold text-warning-strong"
      >
        BẢN NHÁP — đang chờ luật sư xem xét. Nội dung dưới đây mô tả cách little
        hoạt động hiện tại, chưa phải chính sách chính thức.
      </p>
      <LittleCard padding="lg" className="flex flex-col gap-5">
        <h1 className="text-display">Quyền riêng tư</h1>
        <Section title="Chúng tôi lưu những gì">
          <li>
            Của bố mẹ / người giám hộ: email, mật khẩu (được mã hoá bởi dịch vụ
            đăng nhập), tên hiển thị nếu bạn nhập, thời điểm đồng ý.
          </li>
          <li>
            Của bé: tên gọi (biệt danh), hình đại diện chọn sẵn, năm sinh nếu bố
            mẹ cung cấp, cài đặt âm thanh và thời gian nhắc nghỉ.
          </li>
          <li>
            Kết quả học tập: bài đã học, câu trả lời, ngôi sao, huy hiệu, kết
            quả hoạt động khám phá.
          </li>
          <li>
            Chúng tôi không thu thập ảnh, ngày sinh đầy đủ hay email của bé.
          </li>
        </Section>
        <Section title="Chúng tôi dùng để làm gì">
          <li>Để bé học tiếp đúng chỗ, mở khoá bài mới và nhận phần thưởng.</li>
          <li>Để bố mẹ xem tiến độ và gợi ý hoạt động ở nhà.</li>
          <li>Không quảng cáo, không bảng xếp hạng, không bán dữ liệu.</li>
        </Section>
        <Section title="Ai xem được">
          <li>
            Chỉ thành viên trong gia đình của bé. Mỗi gia đình là một không gian
            riêng; gia đình khác không xem được.
          </li>
          <li>
            Dữ liệu được lưu trên Supabase. Khu vực lưu trữ (region) đang chờ
            quyết định và sẽ được ghi rõ ở bản chính thức.
          </li>
        </Section>
        <Section title="Quyền của bạn">
          <li>Tải toàn bộ dữ liệu gia đình trong Cài đặt.</li>
          <li>
            Xoá vĩnh viễn hồ sơ của một bé, cả gia đình, hoặc tài khoản trong
            Cài đặt.
          </li>
          <li>
            Rút lại sự đồng ý: hiện thực hiện bằng cách xoá dữ liệu (chức năng
            rút đồng ý riêng chưa có).
          </li>
        </Section>
      </LittleCard>
      <div>
        <LittleLinkButton href="/" variant="ghost">
          Về trang chủ
        </LittleLinkButton>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-h2">{title}</h2>
      <ul className="list-disc pl-5 text-body">{children}</ul>
    </section>
  );
}
