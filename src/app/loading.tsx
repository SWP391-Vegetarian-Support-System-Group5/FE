import Navbar from "@/components/Navbar";
import RoutePending from "@/components/ui/RoutePending";

export default function Loading() {
  return <div className="min-h-screen bg-[#FBF9F6]">
    <Navbar />
    <main className="flex min-h-[65dvh] items-center justify-center px-6 py-16">
      <RoutePending />
    </main>
  </div>;
}
