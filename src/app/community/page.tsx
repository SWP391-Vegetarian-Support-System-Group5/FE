import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CommunityFeed from "@/components/content/CommunityFeed";

export const metadata = { title: "Community | VeggieMate" };

export default function CommunityPage() {
  return <div className="flex min-h-screen flex-col bg-[#FBF9F6]"><Navbar /><main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10 lg:px-12"><CommunityFeed /></main><Footer /></div>;
}
