"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyOtpWithApi, resendOtpWithApi, ApiError } from "@/lib/auth";

export default function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState<string>("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);
  const [isEmailAlreadyVerified, setIsEmailAlreadyVerified] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 1. Initialize email from query or sessionStorage
  useEffect(() => {
    let resolvedEmail = searchParams.get("email") || "";
    if (!resolvedEmail && typeof window !== "undefined") {
      resolvedEmail = sessionStorage.getItem("veggiemate_pending_email") || "";
    }
    setEmail(resolvedEmail);

    // Check cooldown from sessionStorage
    if (typeof window !== "undefined") {
      const cooldownAt = sessionStorage.getItem("veggiemate_otp_resend_cooldown");
      if (cooldownAt) {
        const remaining = Math.max(0, Math.ceil((Number(cooldownAt) - Date.now()) / 1000));
        setCooldownSeconds(remaining);
      }
    }
  }, [searchParams]);

  // 2. Cooldown timer interval
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  // 3. Auto focus first input on mount
  useEffect(() => {
    if (email) {
      inputRefs.current[0]?.focus();
    }
  }, [email]);

  const handleOtpChange = (index: number, value: string) => {
    setError(null);
    setSuccessMessage(null);

    // Only allow single numeric digit
    const cleaned = value.replace(/[^0-9]/g, "");
    if (!cleaned) {
      const updated = [...otp];
      updated[index] = "";
      setOtp(updated);
      return;
    }

    const digit = cleaned.slice(-1);
    const updated = [...otp];
    updated[index] = digit;
    setOtp(updated);

    // Move to next input if filled
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        // Move back and clear previous
        const updated = [...otp];
        updated[index - 1] = "";
        setOtp(updated);
        inputRefs.current[index - 1]?.focus();
      } else {
        const updated = [...otp];
        updated[index] = "";
        setOtp(updated);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text/plain").replace(/[^0-9]/g, "");
    if (!pasted) return;

    const digits = pasted.slice(0, 6).split("");
    const updated = [...otp];
    digits.forEach((d, i) => {
      updated[i] = d;
    });
    setOtp(updated);

    // Focus on next unfilled or last input
    const nextIndex = Math.min(digits.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email) {
      setError("Không tìm thấy email cần xác thực. Vui lòng đăng ký lại.");
      return;
    }

    const code = otp.join("");
    if (code.length !== 6) {
      setError("Vui lòng nhập đầy đủ mã OTP 6 chữ số.");
      return;
    }

    try {
      setIsVerifying(true);
      await verifyOtpWithApi(email, code);

      // Successfully verified. Per requirement: DO NOT save token or log in.
      // Clear pending verification state
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("veggiemate_pending_email");
        sessionStorage.removeItem("veggiemate_otp_expires_at");
        sessionStorage.removeItem("veggiemate_otp_resend_cooldown");
      }

      // Redirect to login with verified notice and prefilled email
      router.push(`/login?verified=true&email=${encodeURIComponent(email)}`);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const msg = err.message.toLowerCase();
        if (msg.includes("already verified") || msg.includes("đã xác thực")) {
          setIsEmailAlreadyVerified(true);
          setError("Email này đã được xác thực trước đó.");
          return;
        }
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Xác thực OTP thất bại. Vui lòng thử lại.");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = useCallback(async () => {
    if (cooldownSeconds > 0 || isResending || !email) return;

    setError(null);
    setSuccessMessage(null);
    setIsEmailAlreadyVerified(false);

    try {
      setIsResending(true);
      const res = await resendOtpWithApi(email);

      // Start 60-second cooldown
      const cooldownMs = 60 * 1000;
      setCooldownSeconds(60);

      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "veggiemate_otp_resend_cooldown",
          String(Date.now() + cooldownMs)
        );
        if (res.expiresInSeconds) {
          sessionStorage.setItem(
            "veggiemate_otp_expires_at",
            String(Date.now() + res.expiresInSeconds * 1000)
          );
        }
      }

      // Clear current OTP inputs and focus first digit
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();

      setSuccessMessage(
        res.message || "Mã OTP mới đã được gửi tới email của bạn."
      );
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 429) {
          setError("Bạn đã yêu cầu gửi mã quá nhanh. Vui lòng đợi trong giây lát.");
          setCooldownSeconds(60);
        } else if (err.status === 404) {
          setError("Không tìm thấy yêu cầu xác thực cho email này. Vui lòng đăng ký lại.");
        } else {
          setError(err.message);
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Không thể gửi lại mã OTP. Vui lòng thử lại sau.");
      }
    } finally {
      setIsResending(false);
    }
  }, [cooldownSeconds, isResending, email]);

  // Fallback view if accessed without email
  if (!email) {
    return (
      <div className="w-full max-w-[460px] rounded-3xl border border-[#EFEEEB] bg-white p-8 sm:p-10 shadow-sm text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF5F2] text-[#C25E48] text-xl mb-3">
          ⚠️
        </span>
        <h2 className="font-serif text-2xl font-bold text-[#07241A]">
          Thiếu thông tin xác thực
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-[#727974] leading-relaxed">
          Không tìm thấy địa chỉ email đang chờ xác minh OTP. Vui lòng thực hiện đăng ký hoặc đăng nhập.
        </p>
        <div className="mt-6 flex flex-col gap-2.5">
          <Link
            href="/register"
            className="rounded-xl bg-[#1E3A2F] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#07241A]"
          >
            Đến trang Đăng ký
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-[#EFEEEB] bg-[#F5F3F0] px-4 py-2.5 text-xs font-semibold text-[#424844] transition hover:bg-white"
          >
            Đến trang Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  const isComplete = otp.every((d) => d.length === 1);

  return (
    <div className="w-full max-w-[460px] rounded-3xl border border-[#EFEEEB] bg-white p-8 sm:p-10 shadow-sm">
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
        <h1 className="font-serif text-3xl font-medium tracking-tight text-[#07241A]">
          Verify your email
        </h1>
        <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#424844]">
          We have sent a 6-digit verification code to
        </p>
        <p className="font-semibold text-xs sm:text-sm text-[#07241A] break-all mt-0.5">
          {email}
        </p>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#CAEADA] bg-[#F0F9F5] p-3 text-xs text-[#07241A]">
          <span className="text-sm">✓</span>
          <span className="flex-1 leading-relaxed">{successMessage}</span>
        </div>
      )}

      {/* Error Notification Banner */}
      {error && (
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
            <p>{error}</p>
            {isEmailAlreadyVerified && (
              <p className="mt-1">
                <Link
                  href={`/login?email=${encodeURIComponent(email)}`}
                  className="font-bold underline hover:text-[#07241A]"
                >
                  Chuyển tới trang Đăng nhập
                </Link>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setIsEmailAlreadyVerified(false);
            }}
            className="text-[#99462A]/60 hover:text-[#99462A]"
            title="Đóng thông báo"
          >
            ✕
          </button>
        </div>
      )}

      {/* 6-Digit OTP Form */}
      <form onSubmit={handleVerify} className="mt-6 space-y-6">
        <div>
          <label className="block text-center text-xs font-semibold text-[#727974] uppercase tracking-wider mb-3">
            Enter 6-digit Code
          </label>
          <div className="flex items-center justify-between gap-1.5 sm:gap-2.5">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={idx === 0 ? handlePaste : undefined}
                aria-label={`Digit ${idx + 1}`}
                className="h-12 w-11 sm:h-14 sm:w-13 rounded-xl border border-[#EFEEEB] bg-[#F5F3F0] text-center text-lg sm:text-xl font-bold text-[#07241A] transition focus:border-[#1E3A2F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A2F]/20 shadow-xs"
              />
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            type="submit"
            disabled={!isComplete || isVerifying}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E3A2F] px-4 py-3 text-xs font-semibold tracking-wide text-white shadow-sm transition hover:bg-[#07241A] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isVerifying ? (
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
                <span>Đang xác thực mã...</span>
              </>
            ) : (
              <span>Verify Email</span>
            )}
          </button>

          <button
            type="button"
            onClick={handleResendOtp}
            disabled={cooldownSeconds > 0 || isResending}
            className="w-full rounded-xl border border-[#EFEEEB] bg-[#F5F3F0] px-4 py-2.5 text-xs font-semibold text-[#424844] transition hover:bg-white hover:text-[#07241A] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isResending ? (
              <span>Đang gửi lại...</span>
            ) : cooldownSeconds > 0 ? (
              <span>Resend OTP in {String(cooldownSeconds).padStart(2, "0")}s</span>
            ) : (
              <span>Resend OTP</span>
            )}
          </button>
        </div>
      </form>

      {/* Back to Login Link */}
      <div className="mt-6 text-center text-xs">
        <Link
          href={`/login?email=${encodeURIComponent(email)}`}
          className="font-semibold text-[#1E3A2F] hover:underline"
        >
          ← Back to login
        </Link>
      </div>
    </div>
  );
}
