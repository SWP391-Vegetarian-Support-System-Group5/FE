import type { NextConfig } from "next";
import { randomUUID } from "node:crypto";

const authSessionEpoch = process.env.VEGGIEMATE_AUTH_SESSION_EPOCH ??= randomUUID();

const nextConfig: NextConfig = {
  // Lets local/CI builds avoid a synced or locked .next folder without changing Vercel's default output.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  env: { NEXT_PUBLIC_AUTH_SESSION_EPOCH: authSessionEpoch },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
