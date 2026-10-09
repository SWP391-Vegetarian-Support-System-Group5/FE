import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CreateContentView from "@/components/recipe/CreateContentView";

export const metadata: Metadata = {
  title: "Create Content | VeggieMate",
  description:
    "Chia sẻ công thức nấu ăn thuần chay, phân tích video với AI hoặc viết công thức thủ công trên VeggieMate.",
};

export default function CreateContentPage() {
  return (
    <div className="min-h-screen bg-[#FBF9F6] flex flex-col">
      <Navbar />
      <main className="flex-1">
        <CreateContentView />
      </main>
      <Footer />
    </div>
  );
}
