import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  // Stories are named after their machine. Keep the old addresses working.
  async redirects() {
    return [
      { source: "/stories/alsep/:rest*", destination: "/stories/intrepid/:rest*", permanent: true },
      { source: "/stories/apollo-15-rover/:rest*", destination: "/stories/falcon/:rest*", permanent: true },
    ];
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
