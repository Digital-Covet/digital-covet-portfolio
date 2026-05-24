import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { type AppRoute, ROUTES } from "@/lib/constants";

const PUBLIC_ROUTES: AppRoute[] = [
  ROUTES.LOGIN,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
  ROUTES.SETUP_PASSWORD,
  ROUTES.VERIFY_2FA,
  ROUTES.SETUP_2FA,
  ROUTES.TEST_INVITE,
];

const PUBLIC_SHARE_TOKEN_PATTERN = /^\/shares\/[a-f0-9-]{36}$/;

function isPublicRoute(pathname: string): boolean {
  return (
    PUBLIC_ROUTES.some((route) => pathname.startsWith(route)) ||
    PUBLIC_SHARE_TOKEN_PATTERN.test(pathname)
  );
}

function isShareRoute(pathname: string): boolean {
  return PUBLIC_SHARE_TOKEN_PATTERN.test(pathname);
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

  if (!user.passwordChanged) return "NEEDS_PASSWORD_SETUP";
  if (!user.twoFactorEnabled) return "NEEDS_2FA_SETUP";
  if (isPublicRoute(pathname)) return "AUTHENTICATED_ON_PUBLIC";

  return "AUTHENTICATED";
}

const STATE_HANDLERS: Record<
  AuthState,
  (request: NextRequest, pathname: string) => NextResponse
> = {
  PENDING_2FA_VERIFY: (request, pathname) =>
    pathname === ROUTES.VERIFY_2FA
      ? NextResponse.next()
      : NextResponse.redirect(new URL(ROUTES.VERIFY_2FA, request.url)),

  UNAUTHENTICATED: (request, pathname) =>
    isPublicRoute(pathname)
      ? NextResponse.next()
      : NextResponse.redirect(new URL(ROUTES.LOGIN, request.url)),

  NEEDS_PASSWORD_SETUP: (request, pathname) =>
    pathname === ROUTES.SETUP_PASSWORD
      ? NextResponse.next()
      : NextResponse.redirect(new URL(ROUTES.SETUP_PASSWORD, request.url)),

  NEEDS_2FA_SETUP: (request, pathname) =>
    pathname === ROUTES.SETUP_2FA
      ? NextResponse.next()
      : NextResponse.redirect(new URL(ROUTES.SETUP_2FA, request.url)),

  AUTHENTICATED_ON_PUBLIC: (request, pathname) =>
    isShareRoute(pathname)
      ? NextResponse.next()
      : NextResponse.redirect(new URL(ROUTES.DASHBOARD, request.url)),

  AUTHENTICATED: () => NextResponse.next(),
};

function buildCsp(nonce: string, isDev: boolean): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' ${isDev ? "'unsafe-inline'" : `'nonce-${nonce}'`}`,
    "img-src 'self' blob: data:",
    "font-src 'self'",
    "connect-src 'self' https://va.vercel-scripts.com",
    "frame-src 'self' https://www.youtube.com https://player.vimeo.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";
  const cspHeader = buildCsp(nonce, isDev);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspHeader);

  const { pathname } = request.nextUrl;

  if (shouldPassthrough(pathname)) {
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    response.headers.set("Content-Security-Policy", cspHeader);
    response.headers.set("X-Frame-Options", "DENY");
    return response;
  }

  let session: Awaited<ReturnType<typeof auth.api.getSession>> | null = null;

  try {
    session = await auth.api.getSession({
      headers: new Headers({
        cookie: request.headers.get("cookie") ?? "",
      }),
    });
  } catch (error) {
    console.error("[middleware] Session validation error:", error);
    session = null;
  }

  const pending2FA = !session?.user && hasPending2FACookie(request);

  const state = classifyRequest(session, pending2FA, pathname);
  const response = STATE_HANDLERS[state](request, pathname);

  if (!response.headers.get("location")) {
    const nextResponse = NextResponse.next({
      request: { headers: requestHeaders },
    });
    nextResponse.headers.set("Content-Security-Policy", cspHeader);
    nextResponse.headers.set("X-Frame-Options", "DENY");
    return nextResponse;
  }

  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set("X-Frame-Options", "DENY");
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
