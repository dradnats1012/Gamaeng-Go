import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: {
    buildActivity: false,
    buildActivityPosition: 'bottom-right' as const,
  },

  // eslint-disable-next-line @typescript-eslint/require-await
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
