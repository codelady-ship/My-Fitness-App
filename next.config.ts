import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // There is no page at "/", so send visitors to the dashboard.
      { source: "/", destination: "/dashboard", permanent: false },
      // Old misspelled route, kept so existing links still work.
      { source: "/dashbroad", destination: "/dashboard", permanent: true },
    ];
  },
};

export default nextConfig;
