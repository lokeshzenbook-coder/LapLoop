/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    // Images live on an S3-compatible bucket / dev uploads; the optimizer
    // is disabled and remote patterns are open so any storage host works.
    unoptimized: true,
    remotePatterns: [
      { protocol: "http", hostname: "**" },
      { protocol: "https", hostname: "**" },
    ],
  },
};

module.exports = nextConfig;