import type { Metadata } from "next";
import { Newsreader, Plus_Jakarta_Sans } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { AdminModerationProvider } from "@/context/AdminModerationContext";
import { LanguageProvider } from "@/context/LanguageContext";
import AuthAccessBoundary from "@/components/AuthAccessBoundary";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin", "vietnamese"],
  style: ["normal", "italic"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "VeggieMate",
    template: "%s | VeggieMate",
  },
  description: "Khám phá công thức nấu ăn, video ẩm thực và nhà hàng chay thanh đạm.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${newsreader.variable} ${plusJakartaSans.variable}`}
    >
      <body className="min-h-screen bg-[#FBF9F6] text-[#07241A] font-sans antialiased selection:bg-[#D9E6DC] selection:text-[#07241A]">
        <LanguageProvider>
          <AuthProvider>
            <AdminModerationProvider><AuthAccessBoundary>{children}</AuthAccessBoundary></AdminModerationProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
