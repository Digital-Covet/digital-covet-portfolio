import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { type AppRoute, ROUTES } from "@/lib/constants";

const PUBLIC_ROUTES: (AppRoute | "/")[] = [
  "/",
  ROUTES.LOGIN,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
  ROUTES.SETUP_PASSWORD,
  ROUTES.VERIFY_2FA,
  ROUTES.SETUP_2FA,
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
    (prefix) =>
      pathname === prefix || pathname.startsWith(`${prefix}/`),
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
  | "PENDING_2FA_VERIFY"
  | "UNAUTHENTICATED"
  | "NEEDS_PASSWORD_SETUP"
  | "NEEDS_2FA_SETUP"
  | "AUTHENTICATED_ON_PUBLIC"
  | "AUTHENTICATED";

type SessionUser = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>["user"];

function hasPending2FACookie(request: NextRequest): boolean {
  return (
    request.cookies.has("better-auth.two_factor_session") ||
    request.cookies.has("__Secure-better-auth.two_factor_session")
  );
}

function classifyRequest(
  session: { user: SessionUser } | null,
  pending2FA: boolean,
  pathname: string,
): AuthState {
  if (!session?.user) {
    if (pending2FA) return "PENDING_2FA_VERIFY";
    return "UNAUTHENTICATED";
  }

  const { user } = session;

  if (!user.passwordChanged) {
    return "NEEDS_PASSWORD_SETUP";
  }

  if (!user.twoFactorEnabled) {
    return "NEEDS_2FA_SETUP";
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
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""
    }`,

    // next/font + runtime styles
    // nonce covers <style> tags; unsafe-inline required for style= attributes
    `style-src 'self' 'unsafe-inline'${isDev ? "" : ` 'nonce-${nonce}'`}`,

    "img-src 'self' blob: data: https://lh3.googleusercontent.com",

    "font-src 'self' data:",

    "connect-src 'self' https://va.vercel-scripts.com",

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
    console.error("[proxy] Session validation error:", error);

    session = null;
  }

  const pending2FA = !session?.user && hasPending2FACookie(request);

  const state = classifyRequest(session, pending2FA, pathname);

  /**
   * Route handling
   */
  switch (state) {
    case "PENDING_2FA_VERIFY": {
      if (pathname === ROUTES.VERIFY_2FA) {
        const response = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });

        return applySecurityHeaders(response, csp);
      }

      const response = NextResponse.redirect(
        new URL(ROUTES.VERIFY_2FA, request.url),
      );

      return applySecurityHeaders(response, csp);
    }

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

    case "NEEDS_PASSWORD_SETUP": {
      if (pathname === ROUTES.SETUP_PASSWORD) {
        const response = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });

        return applySecurityHeaders(response, csp);
      }

      const response = NextResponse.redirect(
        new URL(ROUTES.SETUP_PASSWORD, request.url),
      );

      return applySecurityHeaders(response, csp);
    }

    case "NEEDS_2FA_SETUP": {
      if (pathname === ROUTES.SETUP_2FA) {
        const response = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });

        return applySecurityHeaders(response, csp);
      }

      const response = NextResponse.redirect(
        new URL(ROUTES.SETUP_2FA, request.url),
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
