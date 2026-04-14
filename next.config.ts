import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dogsrun2.powerappsportals.com',
      }
    ]
  }
};

export default nextConfig;
