import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Đăng nhập | VeggieMate",
  description: "Đăng nhập vào hệ thống VeggieMate để lưu công thức và nhận gợi ý bữa ăn thuần chay thông minh.",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between bg-[#FBF9F6] p-6 sm:p-10">
      {/* Top Bar with Home return */}
      <div className="w-full max-w-5xl flex items-center justify-start">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E3A2F] hover:underline"
        >
          <span>←</span>
          <span>Back to Homepage</span>
        </Link>
      </div>

      {/* Main Login Card */}
      <div className="my-auto py-8">
        <LoginForm />
      </div>

      {/* Benefits Footer row from Figma */}
      <div className="w-full max-w-2xl border-t border-[#EFEEEB] pt-6 pb-2">
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 text-xs font-medium text-[#424844]">
          <div className="flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#07241A" strokeWidth="2">
              <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
            </svg>
            <span>Sync Bookmarks</span>
          </div>

          <div className="flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#07241A" strokeWidth="2">
              <path d="M12 2v4" />
              <path d="M12 18v4" />
              <path d="m4.93 4.93 2.83 2.83" />
              <path d="m16.24 16.24 2.83 2.83" />
              <path d="M2 12h4" />
              <path d="M18 12h4" />
              <path d="m4.93 19.07 2.83-2.83" />
              <path d="m16.24 7.76 2.83-2.83" />
            </svg>
            <span>AI Meal Plans</span>
          </div>

          <div className="flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#07241A" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            <span>Mindful Table</span>
          </div>
        </div>
      </div>
    </main>
  );
}
