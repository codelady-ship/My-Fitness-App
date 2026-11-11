// next.config.js

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {

  },
  // There is no page at "/", so send visitors to the dashboard.
  async redirects() {
    return [{ source: "/", destination: "/dashbroad", permanent: false }];
  },
};

export default nextConfig;
