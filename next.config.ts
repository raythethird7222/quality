// next.config.ts
/** @type {import('next').NextConfig} */
const nextConfig: import('next').NextConfig = {
  images: {
    unoptimized: true,
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-XSS-Protection", value: "1; mode=block" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
        {
          key: "Content-Security-Policy",
          value: (
            process.env.NODE_ENV !== "production"
              ? [
                  "default-src 'self'",
                  "img-src 'self' data: https: blob:",
                  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
                  "style-src 'self' 'unsafe-inline'",
                  "connect-src 'self' https: http: ws: wss:",
                  "font-src 'self' data: https:",
                  "frame-src 'self' https://accounts.google.com https://*.supabase.co",
                  "frame-ancestors 'none'",
                  "base-uri 'self'",
                  "form-action 'self' https:",
                ]
              : [
                  "default-src 'self'",
                  "img-src 'self' data: https: blob:",
                  "script-src 'self' 'unsafe-inline'",
                  "style-src 'self' 'unsafe-inline'",
                  "connect-src 'self' https:",
                  "font-src 'self' data: https:",
                  "frame-src 'self' https://accounts.google.com https://*.supabase.co",
                  "frame-ancestors 'none'",
                  "base-uri 'self'",
                  "form-action 'self' https:",
                ]
          ).join("; "),
        },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      ],
    },
  ],
};

module.exports = nextConfig;
