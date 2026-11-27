# Đưa little lên GitHub Pages (bản chạy trên thiết bị)

Bản này **không cần Supabase hay máy chủ**. Toàn bộ bài học có sẵn trong trang;
chấm bài, mở khoá bài, sao, huy hiệu, mức kỹ năng, hoạt động khám phá và báo cáo
cho bố mẹ đều chạy ngay trên iPad/máy tính của bé. Kết quả lưu trong trình duyệt
của thiết bị đó (DECISIONS D-056).

Địa chỉ sau khi triển khai: `https://theanhsimple.github.io/be-vui-hoc-tap/`

## 1. Cài đặt một lần trên GitHub

1. Mở kho `theanhsimple/be-vui-hoc-tap` → **Settings** → **Pages**.
2. Ở **Build and deployment → Source**, chọn **GitHub Actions**.

> Nếu Pages đang để "Deploy from a branch", bản cũ (`index.html`) vẫn hiển thị
> cho tới khi đổi sang GitHub Actions.

## 2. Đưa bản mới lên

Gộp nhánh `release/github-pages` vào `main` (Pull request → Merge, hoặc
fast-forward). Mỗi lần `main` thay đổi, workflow `.github/workflows/pages.yml`
sẽ tự: cài đặt → kiểm tra kiểu → chạy test → build bản tĩnh → đăng lên Pages
(khoảng 3–5 phút, xem tab **Actions**).

Bản cũ vẫn nằm trong lịch sử git (commit `e93031a`).

## 3. Dùng trên iPad

1. Mở địa chỉ trên bằng **Safari** → **Dành cho bố mẹ** → xác nhận người lớn →
   **Thêm hồ sơ bé**.
2. Nút Chia sẻ → **Thêm vào MH chính**. Bé mở little bằng biểu tượng mặt trời,
   toàn màn hình. (Safari cũng giữ dữ liệu của ứng dụng trên màn hình chính lâu hơn.)
3. Khu vực bố mẹ → **Cài đặt** → **Tải tệp sao lưu** định kỳ (ứng dụng nhắc
   sau 7 ngày). Đổi máy hoặc lỡ xoá dữ liệu: **Khôi phục từ tệp**.

## 4. Giới hạn cần biết

- Dữ liệu ở **từng thiết bị**: iPad và máy tính không đồng bộ với nhau
  (dùng tệp sao lưu để chuyển).
- Đáp án nằm trong mã của trang (cần để chấm bài khi không có máy chủ). Không
  ảnh hưởng với việc bé tự học; nhưng không dùng bản này cho thi cử hay nhiều gia
  đình dùng chung.
- Khu vực bố mẹ được bảo vệ bằng "cổng người lớn", không phải mật khẩu.
- Cần mạng để mở lần đầu; chưa có chế độ ngoại tuyến hoàn toàn.

## 5. Cho người phát triển

```bash
pnpm build:device                      # bản tĩnh vào thư mục out/ (đường dẫn gốc /)
pnpm build:pages                       # như GitHub Pages: /be-vui-hoc-tap
```

- Chỉ các file route `*.device.tsx` được dùng (`pageExtensions`), không có
  proxy, Server Function hay Supabase. Bản máy chủ (`pnpm build`) không thay đổi.
- Bộ máy học: `src/device/engine.ts` (bản TypeScript của các hàm SQL, có test
  đối chiếu trong `src/device/engine.test.ts`); lưu trữ: `src/device/store.ts`.
