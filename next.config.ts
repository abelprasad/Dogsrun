import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dogsrun2.powerappsportals.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      }
    ]
  }
};

export default nextConfig;
