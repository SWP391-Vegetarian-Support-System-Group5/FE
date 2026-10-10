"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function Footer() {
  const { language, setLanguage, t } = useLanguage();
  return (
    <footer className="w-full border-t border-[#EFEEEB] bg-[#F5F3F0] pt-14 pb-8 text-[#07241A]">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand info */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1E3A2F] text-white">
                <svg
                  width="18"
                  height="18"
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
              <span className="font-serif text-2xl font-bold tracking-tight text-[#07241A]">
                VeggieMate
              </span>
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#424844]">
              {t("An editorial sanctuary honoring plant-forward cooking and mindful vegetarian living.", "Không gian chia sẻ ẩm thực thực vật và lối sống chay đầy cảm hứng.")}
            </p>
          </div>

          {/* Explore column */}
          <div>
            <h4 className="text-sm font-semibold tracking-wide text-[#07241A]">
              {t("Explore", "Khám phá")}
            </h4>
            <ul className="mt-4 space-y-2.5 text-xs text-[#424844]">
              <li>
                <Link href="/explore?tab=recipes" className="transition hover:text-[#07241A]">
                  {t("Recipes & Seasons", "Công thức theo mùa")}
                </Link>
              </li>
              <li>
                <Link href="/explore?tab=recipes" className="transition hover:text-[#07241A]">
                  {t("Culinary Videos", "Video nấu ăn")}
                </Link>
              </li>
              <li>
                <Link href="/explore?tab=restaurants" className="transition hover:text-[#07241A]">
                  {t("Restaurant Reviews", "Đánh giá nhà hàng")}
                </Link>
              </li>
              <li>
                <Link href="/vegan-places" className="transition hover:text-[#07241A]">
                  {t("Vegan Places Guide", "Địa điểm chay")}
                </Link>
              </li>
            </ul>
          </div>

          {/* About & Support column */}
          <div>
            <h4 className="text-sm font-semibold tracking-wide text-[#07241A]">
              {t("About & Support", "Giới thiệu & Hỗ trợ")}
            </h4>
            <ul className="mt-4 space-y-2.5 text-xs text-[#424844]">
              <li>
                <a href="#about" className="transition hover:text-[#07241A]">
                  {t("About Our Journey", "Hành trình của chúng tôi")}
                </a>
              </li>
              <li>
                <a href="#contact" className="transition hover:text-[#07241A]">
                  {t("Contact", "Liên hệ")}
                </a>
              </li>
              <li>
                <a href="#privacy" className="transition hover:text-[#07241A]">
                  {t("Privacy Policy", "Chính sách bảo mật")}
                </a>
              </li>
              <li>
                <a href="#terms" className="transition hover:text-[#07241A]">
                  {t("Terms of Service", "Điều khoản sử dụng")}
                </a>
              </li>
            </ul>
          </div>

          {/* Language & Community */}
          <div>
            <h4 className="text-sm font-semibold tracking-wide text-[#07241A]">
              {t("Language & Community", "Ngôn ngữ & Cộng đồng")}
            </h4>
            <p className="mt-4 text-xs text-[#424844]">
              {t("Choose your language:", "Chọn ngôn ngữ của bạn:")}
            </p>
            <div className="mt-2.5 inline-flex items-center gap-2 rounded-xl border border-[#EFEEEB] bg-white px-3 py-1.5 text-xs font-medium text-[#424844]">
              <span>🌐</span>
              <select aria-label={t("Language", "Ngôn ngữ")} value={language} onChange={(event) => setLanguage(event.target.value as "en" | "vi")} className="bg-transparent outline-none">
                <option value="en">English (EN)</option>
                <option value="vi">Tiếng Việt (VI)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-12 flex flex-col items-center justify-between border-t border-[#EFEEEB] pt-6 text-xs text-[#727974] sm:flex-row">
          <p>{t("© 2026 VeggieMate. Crafted for mindful living and plant-forward wellness.", "© 2026 VeggieMate. Đồng hành cùng lối sống chay và sức khỏe của bạn.")}</p>
          <p className="mt-2 sm:mt-0 font-serif italic">{t("Embracing seasonal abundance everyday.", "Trân trọng hương vị thiên nhiên mỗi ngày.")}</p>
        </div>
      </div>
    </footer>
  );
}
