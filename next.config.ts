import type { NextConfig } from "next";

const securityHeaders = [
  // Prevents clickjacking
  { key: "X-Frame-Options", value: "DENY" },
  // Forces HTTPS for 2 years
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Blocks MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Controls referrer info
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Restricts browser features
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  // Content Security Policy
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://logo.clearbit.com https://*.supabase.co",
      "connect-src 'self' https://*.supabase.co https://api.anthropic.com https://api.stripe.com https://api.resend.com https://api.eu.posthog.com",
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "logo.clearbit.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  // Disable powered-by header
  poweredByHeader: false,
  // Enable strict mode for React
  reactStrictMode: true,
  // Vercel cron jobs
  experimental: {
    serverActions: { allowedOrigins: ["subradar.fr", "*.subradar.fr"] },
  },
};

export default nextConfig;
