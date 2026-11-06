import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import { AdminModerationProvider } from "@/context/AdminModerationContext";
import { LanguageProvider } from "@/context/LanguageContext";
import AuthAccessBoundary from "@/components/AuthAccessBoundary";
import InteractionEffects from "@/components/ui/InteractionEffects";
import NavigationLoading from "@/components/ui/NavigationLoading";
import "leaflet/dist/leaflet.css";
import "./globals.css";

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
    <html lang="vi">
      <body className="min-h-screen bg-[#FBF9F6] text-[#07241A] font-sans antialiased selection:bg-[#D9E6DC] selection:text-[#07241A]">
        <InteractionEffects />
        <NavigationLoading />
        <LanguageProvider>
          <AuthProvider>
            <AdminModerationProvider><AuthAccessBoundary>{children}</AuthAccessBoundary></AdminModerationProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
