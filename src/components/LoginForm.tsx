"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder handler - backend not integrated yet
    console.log("Login attempt:", { email });
  };

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
          Welcome to VeggieMate
        </h1>
        <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#424844]">
          Sign in to save recipes, join mindful discussions, and access personalized plant-based nutrition.
        </p>
      </div>

      {/* Google Sign In Button */}
      <div className="mt-6">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#EFEEEB] bg-white px-4 py-2.5 text-xs font-semibold text-[#1B1C1A] shadow-sm transition hover:bg-[#F5F3F0]"
        >
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
          <span>Continue with Google</span>
        </button>
      </div>

      {/* Divider */}
      <div className="relative my-6 flex items-center justify-center">
        <div className="w-full border-t border-[#EFEEEB]" />
        <span className="absolute bg-white px-3 text-xs font-medium text-[#727974]">
          or
        </span>
      </div>

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="name@example.com"
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

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-[#07241A]"
            >
              Password
            </label>
            <a
              href="#forgot-password"
              className="text-[11px] font-semibold text-[#99462A] hover:underline"
            >
              Forgot password?
            </a>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E3A2F] px-4 py-3 text-xs font-semibold tracking-wide text-white shadow-sm transition hover:bg-[#07241A]"
          >
            <span>Log In</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>
        </div>
      </form>

      {/* Switch to Register */}
      <div className="mt-5 text-center text-xs text-[#424844]">
        <span>Don&apos;t have an account? </span>
        <Link
          href="/register"
          className="font-semibold text-[#07241A] underline underline-offset-2 hover:text-[#1E3A2F]"
        >
          Create New Account
        </Link>
      </div>

      {/* Terms & Privacy */}
      <p className="mt-6 text-center font-serif text-[11px] leading-tight text-[#727974]">
        By continuing, you agree to VeggieMate&apos;s{" "}
        <a href="#terms" className="underline hover:text-[#07241A]">Terms of Service</a>{" "}
        and{" "}
        <a href="#privacy" className="underline hover:text-[#07241A]">Privacy Policy</a>.
      </p>
    </div>
  );
}
