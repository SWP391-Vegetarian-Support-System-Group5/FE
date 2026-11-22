import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import VeggieAIWidget from "@/components/VeggieAIWidget";
import BillingView from "@/components/billing/BillingView";

export const metadata: Metadata = { title: "Gói sử dụng | VeggieMate" };

export default function BillingPage() {
  return <><Navbar /><main className="min-h-screen bg-[#FBF9F6]"><div className="mx-auto max-w-5xl px-4 pb-12 pt-[116px] sm:px-6"><BillingView /></div></main><Footer /><VeggieAIWidget /></>;
}
