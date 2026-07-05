"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { ROUTES } from "@/lib/constants";

export default function LoginPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSSOLogin = async () => {
    setSubmitting(true);

    try {
      const response = await authClient.signIn.oauth2({
        providerId: "portfolio",
        callbackURL: ROUTES.DASHBOARD,
      });

      if (response.error) {
        toast.error(response.error.message ?? "SSO sign-in failed.");
        setSubmitting(false);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      toast.error(message);
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-6 p-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            Sign in with your Digital Covet account to continue.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSSOLogin}
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Redirecting to IAM...
            </>
          ) : (
            "Sign in with Digital Covet"
          )}
        </button>
        <p className="text-center text-xs text-muted-foreground">
          You will be redirected to iam.digitalcovet.com to authenticate.
        </p>
      </div>
    </div>
  );
}
