import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import AIChatboxView from "@/components/chat/AIChatboxView";

export const metadata: Metadata = {
  title: "Trợ lý AI | VeggieMate",
  description:
    "Trò chuyện cùng VeggieAI để nhận tư vấn dinh dưỡng chay, công thức món ăn và giải đáp thắc mắc chuyên sâu.",
};

export default function AIChatboxPage() {
  return (
    <div className="h-dvh overflow-hidden bg-[#FBF9F6] flex flex-col">
      <div className="shrink-0"><Navbar /></div>
      <main className="min-h-0 flex-1">
        <AIChatboxView />
      </main>
    </div>
  );
}
