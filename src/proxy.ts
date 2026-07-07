import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { type AppRoute, ROUTES } from "@/lib/constants";
import { logger } from "@/lib/logger";

const PUBLIC_ROUTES: (AppRoute | "/")[] = [
  "/",
  ROUTES.LOGIN,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
  ROUTES.TEST_INVITE,
];

const PROTECTED_ROUTE_PREFIXES: readonly string[] = [
  ROUTES.DASHBOARD,
  ROUTES.SHARES,
  "/case-studies",
  "/clients",
  "/taxonomies",
  "/users",
  "/account",
];

const PUBLIC_SHARE_TOKEN_PATTERN = /^\/shares\/[a-f0-9-]{36}$/;

function isPublicRoute(pathname: string): boolean {
  return (
    PUBLIC_ROUTES.some((route) => {
      if (route === "/") return pathname === "/";
      return pathname === route || pathname.startsWith(`${route}/`);
    }) || PUBLIC_SHARE_TOKEN_PATTERN.test(pathname)
  );
}

function isShareRoute(pathname: string): boolean {
  return PUBLIC_SHARE_TOKEN_PATTERN.test(pathname);
}

function isProtectedRoute(pathname: string): boolean {
  if (isShareRoute(pathname)) return false;

  return PROTECTED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function shouldPassthrough(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    /\.(.+)$/.test(pathname)
  );
}

type AuthState =
  | "UNAUTHENTICATED"
  | "AUTHENTICATED_ON_PUBLIC"
  | "AUTHENTICATED";

type SessionUser = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>["user"];

function hasPending2FACookie(_request: NextRequest): boolean {
  // 2FA is handled by IAM — portfolio never has pending 2FA cookies
  return false;
}

function classifyRequest(
  session: { user: SessionUser } | null,
  _pending2FA: boolean,
  pathname: string,
): AuthState {
  if (!session?.user) {
    return "UNAUTHENTICATED";
  }

  if (isPublicRoute(pathname)) {
    return "AUTHENTICATED_ON_PUBLIC";
  }

  return "AUTHENTICATED";
}

function buildCsp(nonce: string, isDev: boolean): string {
  return [
    "default-src 'self'",

    // STRICT CSP
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${
      isDev ? " 'unsafe-eval'" : ""
    }`,

    // Style policy:
    // CSP rule: when a nonce OR hash is present, browsers IGNORE 'unsafe-inline'.
    // Next.js only nonces styles it emits; Radix UI / shadcn set inline style=""
    // attributes (e.g. --sidebar-width, clip-path) that we cannot nonce.
    // We keep nonce on script-src (the XSS-critical directive) and allow inline
    // styles here.
    `style-src 'self' 'unsafe-inline'`,

    "img-src 'self' blob: data: https://lh3.googleusercontent.com https://digitalcovet.com",

    "font-src 'self' data:",

    // R2 presigned PUT requires wildcard host; R2 account id is variable.
    "connect-src 'self' https://va.vercel-scripts.com https://*.r2.cloudflarestorage.com https://iam.digitalcovet.com",

    "frame-src 'self' https://www.youtube.com https://player.vimeo.com",

    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",

    // hardening
    "upgrade-insecure-requests",
  ].join("; ");
}

function applySecurityHeaders(
  response: NextResponse,
  csp: string,
): NextResponse {
  response.headers.set("Content-Security-Policy", csp);

  response.headers.set("X-Frame-Options", "DENY");

  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  response.headers.set("X-Content-Type-Options", "nosniff");

  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );

  return response;
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  /**
   * Generate cryptographically secure nonce
   */
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const isDev = process.env.NODE_ENV === "development";

  const csp = buildCsp(nonce, isDev);

  /**
   * Forward nonce to App Router render pipeline.
   *
   * CRITICAL:
   * This is how Next.js discovers the nonce
   * during SSR and injects it into:
   *
   * - framework scripts
   * - hydration runtime
   * - chunk loaders
   * - inline bootstrap scripts
   */
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set("x-nonce", nonce);

  const { pathname } = request.nextUrl;

  /**
   * Static assets / API passthrough
   */
  if (shouldPassthrough(pathname)) {
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    return applySecurityHeaders(response, csp);
  }

  /**
   * Session lookup
   */
  let session: Awaited<ReturnType<typeof auth.api.getSession>> | null = null;

  try {
    session = await auth.api.getSession({
      headers: new Headers({
        cookie: request.headers.get("cookie") ?? "",
      }),
    });
  } catch (error) {
    logger.error("Session validation failed", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      pathname,
      hasCookie: !!request.headers.get("cookie"),
    });

    session = null;
  }

  const pending2FA = hasPending2FACookie(request);

  const state = classifyRequest(session, pending2FA, pathname);

  /**
   * Route handling
   */
  switch (state) {
    case "UNAUTHENTICATED": {
      if (!isProtectedRoute(pathname)) {
        const response = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });

        return applySecurityHeaders(response, csp);
      }

      const response = NextResponse.redirect(
        new URL(ROUTES.LOGIN, request.url),
      );

      return applySecurityHeaders(response, csp);
    }

    case "AUTHENTICATED_ON_PUBLIC": {
      if (isShareRoute(pathname)) {
        const response = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });

        return applySecurityHeaders(response, csp);
      }

      const response = NextResponse.redirect(
        new URL(ROUTES.DASHBOARD, request.url),
      );

      return applySecurityHeaders(response, csp);
    }

    default: {
      const response = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });

      return applySecurityHeaders(response, csp);
    }
  }
}

export const config = {
  matcher: [
    /**
     * Exclude:
     * - api routes
     * - next static assets
     * - next image optimizer
     * - favicon
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
