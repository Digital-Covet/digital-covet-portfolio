This file is a merged representation of a subset of the codebase, containing specifically included files, combined into a single document by Repomix.
The content has been processed where comments have been removed, empty lines have been removed.

# File Summary

## Purpose
This file contains a packed representation of a subset of the repository's contents that is considered the most important context.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Only files matching these patterns are included: **/setup*, **/proxy*, **/auth.ts
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Code comments have been removed from supported file types
- Empty lines have been removed from all files
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
```
src/
  app/
    auth/
      setup-2fa/
        setup-2fa-content.tsx
  components/
    setup-password-form.tsx
  lib/
    auth.ts
  proxy.ts
```

# Files

## File: src/app/auth/setup-2fa/setup-2fa-content.tsx
```typescript
"use client";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { toast } from "sonner";
import { TwoFactorSetup } from "@/components/two-factor-setup";
function Setup2FAContent() {
  const router = useRouter();
  const handleComplete = () => {
    toast.success("Two-factor authentication enabled!");
    router.push("/dashboard");
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <TwoFactorSetup onComplete={handleComplete} />
      </div>
    </div>
  );
}
export function Setup2FAContentWithSuspense() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading setup...</p>
        </div>
      }
    >
      <Setup2FAContent />
    </Suspense>
  );
}
```

## File: src/proxy.ts
```typescript
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
```

## File: src/components/setup-password-form.tsx
```typescript
"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { setupPassword } from "@/actions/invite";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
interface SetupPasswordFormProps {
  email: string;
  token: string;
}
export function SetupPasswordForm({ email, token }: SetupPasswordFormProps) {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setIsLoading(true);
    const result = await setupPassword(token, newPassword);
    if (!result.ok) {
      toast.error(result.error);
    } else if (result.data.success) {
      toast.success("Password changed successfully!");
      const signInResult = await authClient.signIn.email({
        email,
        password: newPassword,
      });
      if (signInResult.error) {
        toast.error(
          "Password changed but sign in failed. Please log in manually.",
        );
        router.push("/auth/login");
      } else {
        router.push("/auth/setup-2fa");
      }
    }
    setIsLoading(false);
  };
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Set up your password</CardTitle>
        <CardDescription>
          Create a secure password for{" "}
          <span className="font-medium">{email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter a secure password"
              required
              minLength={8}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
              minLength={8}
              disabled={isLoading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Setting up..." : "Set password & continue"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

## File: src/lib/auth.ts
```typescript
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin as adminPlugin, twoFactor } from "better-auth/plugins";
import { prisma } from "@/db";
import { sendEmail } from "@/services/email";
import { ac, adminRole, employeeRole, superadminRole } from "./permission";
export const auth = betterAuth({
  trustedOrigins: ["https://portfolio.digitalcovet.com"],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }, _request) => {
      try {
        await sendEmail({
          to: user.email,
          subject: "Reset your password",
          text: `Click the link to reset your password: ${url}`,
        });
      } catch (error) {
        console.error(
          "[Auth Hook] Failed to send reset password email:",
          error instanceof Error ? error.message : error,
        );
        throw new Error("Failed to send reset password email.");
      }
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    sendVerificationEmail: async ({ user, url }, _request) => {
      try {
        await sendEmail({
          to: user.email,
          subject: "Verify your email address",
          text: `Click the link to verify your email: ${url}`,
        });
      } catch (error) {
        console.error(
          "[Auth Hook] Failed to send verification email:",
          error instanceof Error ? error.message : error,
        );
        throw new Error("Failed to send verification email.");
      }
    },
  },
  user: {
    additionalFields: {
      departmentId: {
        type: "string",
        required: false,
        defaultValue: null,
      },
      passwordChanged: {
        type: "boolean",
        required: false,
        defaultValue: false,
      },
    },
  },
  plugins: [
    twoFactor({
      issuer: "Digital Covet",
    }),
    adminPlugin({
      defaultRole: "employee",
      ac,
      roles: {
        superadmin: superadminRole,
        admin: adminRole,
        employee: employeeRole,
      },
    }),
  ],
});
```
