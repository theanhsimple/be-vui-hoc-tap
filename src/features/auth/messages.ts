/** Maps Supabase Auth error codes to calm Vietnamese messages for parents. */
export function authErrorMessage(code: string | undefined): string {
  switch (code) {
    case "invalid_credentials":
      return "Email hoặc mật khẩu chưa đúng.";
    case "email_not_confirmed":
      return "Email chưa được xác nhận. Bố mẹ hãy mở thư xác nhận chúng tôi đã gửi.";
    case "user_already_exists":
    case "email_exists":
      return "Email này đã được dùng. Bố mẹ hãy đăng nhập hoặc đặt lại mật khẩu.";
    case "weak_password":
      return "Mật khẩu cần ít nhất 8 ký tự, gồm cả chữ và số.";
    case "same_password":
      return "Mật khẩu mới cần khác mật khẩu cũ.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Bố mẹ thao tác hơi nhanh. Vui lòng thử lại sau ít phút.";
    case "reauthentication_needed":
    case "session_not_found":
    case "session_expired":
      return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    case "signup_disabled":
      return "Đăng ký đang tạm đóng.";
    default:
      return "Có lỗi xảy ra. Vui lòng thử lại.";
  }
}
