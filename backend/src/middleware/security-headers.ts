import type { MiddlewareHandler } from "hono";


export function securityHeaders(): MiddlewareHandler {
  return async (c, next) => {
    await next();

    c.res.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );

    c.res.headers.set("X-Content-Type-Options", "nosniff");
    c.res.headers.set("X-Frame-Options", "DENY");

    c.res.headers.set(
      "Referrer-Policy",
      "strict-origin-when-cross-origin"
    );

    c.res.headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), accelerometer=(), gyroscope=()"
    );

    c.res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
    c.res.headers.set("Cross-Origin-Resource-Policy", "same-origin");
    c.res.headers.set("Origin-Agent-Cluster", "?1");

    if (!c.res.headers.has("Content-Security-Policy")) {
      c.res.headers.set(
        "Content-Security-Policy",
        "default-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'"
      );
    }

    c.res.headers.delete("Server");
    c.res.headers.delete("X-Powered-By");
  };
}
