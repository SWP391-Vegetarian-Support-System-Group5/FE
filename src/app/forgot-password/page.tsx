"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { requestPasswordResetWithApi, resetPasswordWithApi } from "@/lib/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [requested, setRequested] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError(null); setMessage(null);
    try {
      if (!requested) {
        const response = await requestPasswordResetWithApi(email.trim());
        setRequested(true);
        setMessage(response.message || "Nếu email tồn tại, mã đặt lại mật khẩu đã được gửi.");
      } else {
        const response = await resetPasswordWithApi(email.trim(), otpCode.trim(), newPassword);
        setMessage(response.message || "Đổi mật khẩu thành công. Bạn có thể đăng nhập lại.");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Có lỗi xảy ra. Vui lòng thử lại.");
    } finally { setBusy(false); }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FBF9F6] p-6">
      <section className="w-full max-w-md rounded-3xl border border-[#EFEEEB] bg-white p-8 shadow-sm">
        <h1 className="font-serif text-3xl text-[#07241A]">Quên mật khẩu</h1>
        <p className="mt-2 text-sm text-[#727974]">{requested ? "Nhập mã OTP và mật khẩu mới." : "Nhập email để nhận mã đặt lại mật khẩu."}</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <input type="email" required autoComplete="email" value={email} disabled={requested} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-xl border bg-[#F5F3F0] px-4 py-3 text-sm disabled:opacity-70" />
          {requested && <>
            <input required inputMode="numeric" autoComplete="one-time-code" value={otpCode} onChange={e => setOtpCode(e.target.value)} placeholder="Mã OTP" className="w-full rounded-xl border bg-[#F5F3F0] px-4 py-3 text-sm" />
            <input type="password" required minLength={8} autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mật khẩu mới" className="w-full rounded-xl border bg-[#F5F3F0] px-4 py-3 text-sm" />
          </>}
          {message && <p className="text-sm text-green-700" role="status">{message}</p>}
          {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
          <button disabled={busy} className="w-full rounded-xl bg-[#1E3A2F] px-4 py-3 font-semibold text-white disabled:opacity-60">{busy ? "Đang xử lý..." : requested ? "Đặt lại mật khẩu" : "Gửi mã OTP"}</button>
        </form>
        <Link href="/login" className="mt-5 block text-center text-sm font-semibold text-[#99462A] hover:underline">Quay lại đăng nhập</Link>
      </section>
    </main>
  );
}
