import type { Metadata } from "next";
import Footer from "@/components/Footer";
import LocationExplorer from "@/components/LocationExplorer";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Vegan Places | VeggieMate",
  description: "Tìm nhà hàng và địa điểm chay gần bạn trên bản đồ Việt Nam.",
};

export default function VeganPlacesPage() {
  return <div className="min-h-screen bg-[#faf8f4]"><Navbar /><main><LocationExplorer /></main><Footer /></div>;
}
