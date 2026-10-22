import Navbar from "@/components/Navbar";
import CardSkeleton from "@/components/ui/CardSkeleton";

export default function Loading() {
  return <div className="min-h-screen bg-[#FBF9F6]">
    <Navbar />
    <main className="mx-auto max-w-7xl px-6 py-10 lg:px-12">
      <div aria-hidden="true" className="space-y-4"><div className="vm-skeleton h-8 w-48 rounded-xl" /><div className="vm-skeleton h-4 w-64 max-w-full rounded-lg" /></div>
      <CardSkeleton />
    </main>
  </div>;
}
