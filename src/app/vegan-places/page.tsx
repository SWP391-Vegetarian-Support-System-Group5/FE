import type { Metadata } from "next";
import CuratedVeganPlaces from "@/components/CuratedVeganPlaces";
import Footer from "@/components/Footer";
import LocationExplorer from "@/components/LocationExplorer";
import Navbar from "@/components/Navbar";
import VeggieAIWidget from "@/components/VeggieAIWidget";

export const metadata: Metadata = {
  title: "Vegan Places | VeggieMate",
  description: "Tìm nhà hàng và địa điểm chay gần bạn trên bản đồ Việt Nam.",
};

export default function VeganPlacesPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F4] flex flex-col">
      <Navbar />
      <main className="flex-1">
        <LocationExplorer />
        <CuratedVeganPlaces />
      </main>
      <VeggieAIWidget />
      <Footer />
    </div>
  );
}
