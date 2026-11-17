import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // Old misspelled route, kept so existing links still work.
    return [{ source: "/dashbroad", destination: "/dashboard", permanent: true }];
  },
};

export default nextConfig;
