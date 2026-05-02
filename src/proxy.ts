import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ROUTES } from "@/lib/constants";

const publicRoutes = [
  ROUTES.LOGIN,
  "/auth/forgot-password",
  "/auth/reset-password",
  ROUTES.SETUP_PASSWORD,
  "/auth/verify-2fa",
  ROUTES.SETUP_2FA,
  "/auth/test-invite",
] as const;

const TWO_FACTOR_PENDING_COOKIE = "better-auth.two_factor_session";

const TWO_FACTOR_PENDING_COOKIE_SECURE =
  "__Secure-better-auth.two_factor_session";

const isPublicRoute = (path: string): boolean =>
  publicRoutes.some((route) => path.startsWith(route));

const getVerifiedSessionCookie = (request: NextRequest): string | undefined =>
  request.cookies.get("better-auth.session_token")?.value ??
  request.cookies.get("__Secure-better-auth.session_token")?.value;

const getPending2FACookie = (request: NextRequest): string | undefined =>
  request.cookies.get(TWO_FACTOR_PENDING_COOKIE)?.value ??
  request.cookies.get(TWO_FACTOR_PENDING_COOKIE_SECURE)?.value;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    /\.(.+)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const verifiedCookie = getVerifiedSessionCookie(request);
  const pendingCookie = getPending2FACookie(request);

  if (pendingCookie && !verifiedCookie) {
    if (pathname === "/auth/verify-2fa") {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL("/auth/verify-2fa", request.url));
  }

  if (!verifiedCookie) {
    if (!isPublicRoute(pathname)) {
      return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
    }
    return NextResponse.next();
  }

  try {
    const session = await auth.api.getSession({
      headers: new Headers({ cookie: request.headers.get("cookie") ?? "" }),
    });

    if (!session?.user) {
      if (!isPublicRoute(pathname)) {
        return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
      }
      return NextResponse.next();
    }

    const { user } = session;

    if (user.passwordChanged === false && pathname !== ROUTES.SETUP_PASSWORD) {
      return NextResponse.redirect(new URL(ROUTES.SETUP_PASSWORD, request.url));
    }

    if (
      user.twoFactorEnabled === false &&
      pathname !== ROUTES.SETUP_2FA &&
      !isPublicRoute(pathname)
    ) {
      return NextResponse.redirect(new URL(ROUTES.SETUP_2FA, request.url));
    }

    if (isPublicRoute(pathname)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  } catch (error) {
    console.error("[proxy] Session validation error:", error);
    if (!isPublicRoute(pathname)) {
      return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
