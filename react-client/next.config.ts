import type { NextConfig } from "next";

/**
 * Derive the LocalStack / S3 public display hostname from the optional
 * NEXT_PUBLIC_S3_PUBLIC_URL env var (e.g. "http://localhost:4566").
 * When the var is set we extract just the hostname so we can add it as a
 * next/image remotePattern. When it is absent (Cloudinary-only or prod) we
 * skip adding that pattern entirely.
 */
function parseS3PublicHostname(): string | null {
  const raw = process.env.NEXT_PUBLIC_S3_PUBLIC_URL;
  if (!raw) return null;
  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
}

const s3PublicHostname = parseS3PublicHostname();

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Produces a minimal, self-contained server bundle in .next/standalone
  // for a small production Docker image.
  output: "standalone",
  images: {
    // Product images may come from three different origins depending on the
    // active StorageStrategy and environment:
    //
    //  1. Cloudinary  — STORAGE_PROVIDER=cloudinary (non-Docker local dev)
    //  2. AWS S3      — STORAGE_PROVIDER=s3 in production (real AWS)
    //  3. LocalStack  — STORAGE_PROVIDER=s3 in Docker dev (localhost:4566)
    //
    // All remote origins must be explicitly allow-listed here. Call-sites that
    // render presigned S3 URLs must also pass `unoptimized` so the image
    // optimizer doesn't cache the signed query string beyond its expiry.
    remotePatterns: [
      // ── Cloudinary ──────────────────────────────────────────────────────
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },

      // ── AWS S3 (production) ─────────────────────────────────────────────
      // Covers path-style (s3.amazonaws.com/<bucket>/…) and virtual-hosted
      // style (<bucket>.s3.<region>.amazonaws.com/…) presigned URLs.
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
        pathname: "/**",
      },

      // ── LocalStack (Docker dev) ─────────────────────────────────────────
      // LocalStack serves S3 over plain http on the host-mapped port
      // (default 4566). The hostname is derived from NEXT_PUBLIC_S3_PUBLIC_URL
      // so the config stays correct even if the port is changed.
      ...(s3PublicHostname
        ? [
            {
              protocol: "http" as const,
              hostname: s3PublicHostname,
              pathname: "/**",
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
