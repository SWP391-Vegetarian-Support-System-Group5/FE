import type { NextConfig } from "next";
import { randomUUID } from "node:crypto";

const authSessionEpoch = process.env.VEGGIEMATE_AUTH_SESSION_EPOCH ??= randomUUID();

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_AUTH_SESSION_EPOCH: authSessionEpoch },
  async redirects() {
    return [{ source: "/explore", destination: "/community", permanent: false }];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
