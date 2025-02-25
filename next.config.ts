import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["technolitics-s3-bucket.s3.ap-south-1.amazonaws.com"],
  },
};

export default nextConfig;
