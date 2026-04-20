import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["kuroshiro", "kuroshiro-analyzer-kuromoji", "kuromoji"],
  outputFileTracingIncludes: {
    "/api/process-news": ["public/dict/**/*"],
  },
};

export default nextConfig;
