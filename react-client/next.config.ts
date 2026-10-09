import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Produces a minimal, self-contained server bundle in .next/standalone
  // for a small production Docker image.
  output: "standalone",
};

export default nextConfig;
