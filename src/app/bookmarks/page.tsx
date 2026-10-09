import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BookmarksView from "@/components/bookmarks/BookmarksView";
import VeggieAIWidget from "@/components/VeggieAIWidget";

export const metadata: Metadata = {
  title: "My Collection | VeggieMate",
  description:
    "Bộ sưu tập công thức nấu ăn thuần chay và địa điểm ẩm thực chay đã lưu của bạn trên VeggieMate.",
};

export default function BookmarksPage() {
  return (
    <div className="min-h-screen bg-[#FBF9F6] flex flex-col">
      <Navbar />
      <main className="flex-1">
        <BookmarksView />
      </main>
      <VeggieAIWidget />
      <Footer />
    </div>
  );
}
