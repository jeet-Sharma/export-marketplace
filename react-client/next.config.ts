import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Produces a minimal, self-contained server bundle in .next/standalone
  // for a small production Docker image.
  output: "standalone",
  images: {
    // Product primary images are served from Cloudinary
    // (CloudinaryStorageStrategy.getDisplayUrl on the backend) — next/image
    // requires every remote image host to be explicitly allow-listed.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
