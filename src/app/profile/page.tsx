import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProfileForm from "@/components/profile/ProfileForm";
import VeggieAIWidget from "@/components/VeggieAIWidget";

export const metadata: Metadata = {
  title: "My Profile | VeggieMate",
  description:
    "Manage your personal information, health details and living location to shape your seasonal table.",
};

/**
 * Profile & Health page — /profile
 *
 * This page uses demo data in development while no authentication system is in place.
 * It does NOT fake a login session or treat demo data as a real authenticated user.
 */
export default function ProfilePage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#FBF9F6]">
        {/* Top padding accounts for sticky Navbar height (~80px) */}
        <div className="mx-auto max-w-[960px] px-4 pb-10 pt-[120px] sm:px-6">
          <div className="flex flex-col gap-8">
            <ProfileForm />
          </div>
        </div>
      </main>

      <Footer />
      <VeggieAIWidget />
    </>
  );
}
