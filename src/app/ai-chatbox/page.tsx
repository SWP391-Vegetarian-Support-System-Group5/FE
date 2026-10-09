import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AIChatboxView from "@/components/chat/AIChatboxView";

export const metadata: Metadata = {
  title: "AI Chatbox | VeggieMate",
  description:
    "Trò chuyện cùng VeggieAI để nhận tư vấn dinh dưỡng chay, công thức món ăn và giải đáp thắc mắc chuyên sâu.",
};

export default function AIChatboxPage() {
  return (
    <div className="min-h-screen bg-[#FBF9F6] flex flex-col">
      <Navbar />
      <main className="flex-1">
        <AIChatboxView />
      </main>
      <Footer />
    </div>
  );
}
