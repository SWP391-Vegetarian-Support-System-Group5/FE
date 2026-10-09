"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { registerWithApi, ApiError } from "@/lib/auth";

export default function RegisterForm() {
  const router = useRouter();
  const { signInWithGoogle, user, error: authError, clearError } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [emailExists, setEmailExists] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      setLocalError(null);
      setEmailExists(false);
      clearError();
      const signedInUser = await signInWithGoogle();
      if (signedInUser) {
        router.push("/");
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Đăng nhập Google không thành công. Vui lòng thử lại.";
      setLocalError(msg);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const validate = (): string | null => {
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      return "Vui lòng nhập họ và tên.";
    }
    if (trimmedName.length > 150) {
      return "Họ và tên không được vượt quá 150 ký tự.";
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      return "Vui lòng nhập địa chỉ email.";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return "Địa chỉ email không hợp lệ.";
    }

    // Password must be at least 6 characters, do NOT trim password
    if (password.length < 6) {
      return "Mật khẩu phải có tối thiểu 6 ký tự.";
    }

    if (password !== confirmPassword) {
      return "Mật khẩu xác nhận không khớp.";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setEmailExists(false);
    clearError();

    const validationError = validate();
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    try {
      setIsSubmitting(true);

      const targetEmail = email.trim();
      // Backend expects { name, email, password }
      const res = await registerWithApi(fullName.trim(), targetEmail, password);

      // Store pending verification details in sessionStorage so reload preserves state
      if (typeof window !== "undefined") {
        const expiresInSeconds = res.expiresInSeconds || 600;
        sessionStorage.setItem("veggiemate_pending_email", targetEmail);
        sessionStorage.setItem(
          "veggiemate_otp_expires_at",
          String(Date.now() + expiresInSeconds * 1000)
        );
        // 60-second cooldown between resends
        sessionStorage.setItem(
          "veggiemate_otp_resend_cooldown",
          String(Date.now() + 60 * 1000)
        );
      }

      // Navigate to OTP verification without logging in
      router.push(`/verify-otp?email=${encodeURIComponent(targetEmail)}`);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const msg = err.message.toLowerCase();
        if (
          err.status === 409 ||
          msg.includes("already exists") ||
          msg.includes("đã tồn tại") ||
          msg.includes("already registered") ||
          msg.includes("duplicate")
        ) {
          setEmailExists(true);
          setLocalError("Email này đã được đăng ký tài khoản.");
          return;
        }
        setLocalError(err.message);
      } else if (err instanceof Error) {
        setLocalError(err.message);
      } else {
        setLocalError("Đăng ký không thành công. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeError = localError || authError;

  return (
    <div className="w-full max-w-[496px] rounded-3xl border border-[#EFEEEB] bg-white p-8 sm:p-10 shadow-sm">
      {/* Brand Header */}
      <div className="text-center">
        <Link href="/" className="inline-flex items-center gap-2 group mb-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1E3A2F] text-white">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
          </span>
          <span className="font-serif text-xl font-bold tracking-tight text-[#07241A]">
            VeggieMate
          </span>
        </Link>
        <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-[#07241A]">
          Welcome to VeggieMate
        </h1>
        <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#424844]">
          Create an account to save recipes, join mindful discussions, and access personalized plant-based nutrition.
        </p>
      </div>

      {/* Logged in notification if already authenticated */}
      {user && (
        <div className="mt-4 rounded-xl border border-[#CAEADA] bg-[#F0F9F5] p-3 text-xs text-[#07241A]">
          <div className="flex items-center justify-between">
            <span>
              Đã đăng nhập: <strong>{user.displayName || user.email}</strong>
            </span>
            <Link
              href="/"
              className="font-semibold text-[#1E3A2F] underline hover:text-[#07241A]"
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {activeError && (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#FFDBD0] bg-[#FFF5F2] p-3.5 text-xs text-[#99462A]">
          <svg
            className="mt-0.5 h-4 w-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div className="flex-1 leading-relaxed">
            <p>{activeError}</p>
            {emailExists && (
              <p className="mt-1">
                Bạn đã có tài khoản với email này?{" "}
                <Link
                  href={`/login?email=${encodeURIComponent(email.trim())}`}
                  className="font-bold underline hover:text-[#07241A]"
                >
                  Đăng nhập tại đây
                </Link>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setLocalError(null);
              setEmailExists(false);
              clearError();
            }}
            className="text-[#99462A]/60 hover:text-[#99462A]"
            title="Đóng thông báo"
          >
            ✕
          </button>
        </div>
      )}

      {/* Google Sign In Button */}
      <div className="mt-6">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading || isSubmitting}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#EFEEEB] bg-[#F5F3F0] px-4 py-2.5 text-xs font-semibold text-[#1B1C1A] shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isGoogleLoading ? (
            <svg
              className="h-4 w-4 animate-spin text-[#1E3A2F]"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                className="opacity-25"
              />
              <path
                d="M4 12a8 8 0 018-8"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                className="opacity-75"
              />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.14 0 9.9 0 12s.45 3.86 1.24 5.42l4.04-3.15Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
              />
            </svg>
          )}
          <span>
            {isGoogleLoading ? "Connecting to Google..." : "Continue with Google"}
          </span>
        </button>
      </div>

      {/* Divider */}
      <div className="relative my-6 flex items-center justify-center">
        <div className="w-full border-t border-[#EFEEEB]" />
        <span className="absolute bg-white px-3 text-xs font-semibold text-[#727974] tracking-wider">
          OR
        </span>
      </div>

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label
            htmlFor="fullName"
            className="block text-xs font-semibold text-[#07241A] mb-1.5"
          >
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            required
            maxLength={150}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your full name"
            className="w-full rounded-xl border border-[#EFEEEB] bg-[#F5F3F0] px-3.5 py-2.5 text-xs text-[#07241A] placeholder-[#727974] transition focus:border-[#1E3A2F] focus:bg-white focus:outline-none"
          />
        </div>

        {/* Email Address */}
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-semibold text-[#07241A] mb-1.5"
          >
            Email address
          </label>
          <div className="relative">
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full rounded-xl border border-[#EFEEEB] bg-[#F5F3F0] px-3.5 py-2.5 text-xs text-[#07241A] placeholder-[#727974] transition focus:border-[#1E3A2F] focus:bg-white focus:outline-none"
            />
            <div className="absolute right-3.5 top-3 text-[#727974]">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="block text-xs font-semibold text-[#07241A] mb-1.5"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password (min 6 characters)"
              className="w-full rounded-xl border border-[#EFEEEB] bg-[#F5F3F0] px-3.5 py-2.5 text-xs text-[#07241A] placeholder-[#727974] transition focus:border-[#1E3A2F] focus:bg-white focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-2.5 text-[#727974] hover:text-[#07241A]"
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                  <line x1="2" x2="22" y1="2" y2="22" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-xs font-semibold text-[#07241A] mb-1.5"
          >
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className="w-full rounded-xl border border-[#EFEEEB] bg-[#F5F3F0] px-3.5 py-2.5 text-xs text-[#07241A] placeholder-[#727974] transition focus:border-[#1E3A2F] focus:bg-white focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 top-2.5 text-[#727974] hover:text-[#07241A]"
              title={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                  <line x1="2" x2="22" y1="2" y2="22" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting || isGoogleLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E3A2F] px-4 py-3 text-xs font-semibold tracking-wide text-[#FBF9F6] shadow-sm transition hover:bg-[#07241A] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="opacity-25"
                  />
                  <path
                    d="M4 12a8 8 0 018-8"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className="opacity-75"
                  />
                </svg>
                <span>Đang xử lý đăng ký...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Switch to Login */}
      <div className="mt-5 text-center text-xs text-[#424844]">
        <span>Already have an account? </span>
        <Link
          href="/login"
          className="font-semibold text-[#1E3A2F] underline underline-offset-2 hover:text-[#07241A]"
        >
          Log In
        </Link>
      </div>

      {/* Terms & Privacy */}
      <p className="mt-6 text-center font-serif italic text-[11px] leading-tight text-[#727974]">
        By continuing, you agree to VeggieMate&apos;s{" "}
        <a href="#terms" className="underline hover:text-[#07241A]">Terms of Service</a>{" "}
        and{" "}
        <a href="#privacy" className="underline hover:text-[#07241A]">Privacy Policy</a>.
      </p>
    </div>
  );
}
