/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },

  // Security headers. Narrowest CSP that works with this Next.js + Supabase app:
  //   - script-src 'self' 'unsafe-inline': the app renders an inline theme
  //     script (src/app/layout.tsx) and Next.js injects inline hydration
  //     scripts, so 'unsafe-inline' is genuinely required. Inline JSON-LD
  //     <script type="application/ld+json"> blocks are data, not executable.
  //   - style-src 'self' 'unsafe-inline': Next.js emits inline <style> for
  //     critical CSS during streaming.
  //   - connect-src includes https/wss for the Supabase client (REST, storage,
  //     auth, realtime). ws/http localhost entries keep `next dev` HMR working,
  //     since these headers are also applied in development.
  //   - img-src https://*.supabase.co: report photos / avatars served straight
  //     from Supabase storage; data:/blob: cover thumbnails & previews.
  //   - font-src 'self' data:: Plus_Jakarta_Sans is self-hosted via
  //     next/font (may inline subsets as data: URIs).
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "object-src 'none'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.supabase.co",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co ws://localhost:* http://localhost:*",
              "script-src-attr 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
