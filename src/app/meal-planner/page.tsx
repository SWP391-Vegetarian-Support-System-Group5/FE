import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MealPlannerView from "@/components/meal-planner/MealPlannerView";
import VeggieAIWidget from "@/components/VeggieAIWidget";

export const metadata: Metadata = {
  title: "Plan My Week | VeggieMate",
  description:
    "Lên kế hoạch thực đơn thuần chay 7 ngày được cá nhân hóa theo kho nguyên liệu và mục tiêu sức khỏe của bạn.",
};

export default function MealPlannerPage() {
  return (
    <div className="min-h-screen bg-[#FBF9F6] flex flex-col">
      <Navbar />
      <main className="flex-1">
        <MealPlannerView />
      </main>
      <VeggieAIWidget />
      <Footer />
    </div>
  );
}
