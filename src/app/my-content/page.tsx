import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import VeggieAIWidget from "@/components/VeggieAIWidget";
import MyContentView from "@/components/content/MyContentView";

export const metadata: Metadata = {
  title: "My Content",
  description: "Manage your vegetarian recipes, cooking videos and saved drafts on VeggieMate.",
};

export default function MyContentPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FBF9F6]">
      <Navbar />
      <main className="flex-1"><MyContentView /></main>
      <Footer />
      <VeggieAIWidget />
    </div>
  );
}
