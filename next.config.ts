import type { NextConfig } from "next";
import nextPwa from "next-pwa";

const withPWA = nextPwa({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      // Allow local images under /public/images with or without query strings
      { pathname: "/images/**" },
      { pathname: "/images/**", search: "?*" },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cityquest-uat.s3.ap-south-1.amazonaws.com",
        pathname: "/**",
      },
    ],
  },
};

export default withPWA(nextConfig);
