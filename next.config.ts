import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/** Origin of the Pulsa API (if configured) — the only external host the browser may call. */
const apiOrigin = (() => {
  try {
    return process.env.NEXT_PUBLIC_API_URL ? new URL(process.env.NEXT_PUBLIC_API_URL).origin : "";
  } catch {
    return "";
  }
})();

/**
 * Origins allowed to show Pulsa in an iframe. CSP frame-ancestors is the only framing control:
 * X-Frame-Options cannot express an allow-list, and modern browsers ignore it when frame-ancestors is set.
 */
const FRAME_ANCESTORS = ["'self'", "https://antiqa-portfolio.vercel.app", "https://antiqacode.vercel.app"];

/**
 * Content Security Policy. Everything (fonts via next/font, videos, images) is served from this origin.
 * 'unsafe-inline' for scripts is needed by the App Router's inline hydration scripts without per-request
 * nonces (nonces would make every page dynamic and drop the static/ISR pages); 'unsafe-inline' for styles
 * covers React style props. No third-party scripts are loaded.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self'",
  "font-src 'self'",
  `connect-src 'self'${apiOrigin ? " " + apiOrigin : ""}${isDev ? " ws:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // Only the owner's portfolio may embed the demo (its project modal shows it in an iframe).
  `frame-ancestors ${FRAME_ANCESTORS.join(" ")}`,
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
        ],
      },
    ];
  },
  async redirects() {
    // Old misspelled route, kept so existing links still work.
    return [{ source: "/dashbroad", destination: "/dashboard", permanent: true }];
  },
};

export default nextConfig;
