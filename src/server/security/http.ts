import { NextResponse } from "next/server";
import { AppError } from "@/server/security/errors";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  const response = NextResponse.json(data, init);
  applySecurityHeaders(response);
  return response;
}

export function jsonError(error: unknown) {
  if (error instanceof AppError) {
    const response = NextResponse.json(
      { success: false, error: error.expose ? error.message : "Request failed" },
      { status: error.status }
    );
    applySecurityHeaders(response);
    return response;
  }

  // Log the actual error server-side for debugging but never expose it.
  console.error("[API] Unhandled error:", error);

  const response = NextResponse.json(
    { success: false, error: "Internal server error" },
    { status: 500 }
  );
  applySecurityHeaders(response);
  return response;
}

export function applySecurityHeaders(response: NextResponse) {
  const isDevelopment = process.env.NODE_ENV !== "production";
  const scriptSrc = isDevelopment
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'";
  const connectSrc = isDevelopment
    ? "connect-src 'self' https: http: ws: wss:"
    : "connect-src 'self' https:";

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "img-src 'self' data: https: blob:",
      scriptSrc,
      "style-src 'self' 'unsafe-inline'",
      connectSrc,
      "font-src 'self' data: https:",
      "frame-src 'self' https://accounts.google.com https://*.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self' https:",
    ].join("; ")
  );
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
}
