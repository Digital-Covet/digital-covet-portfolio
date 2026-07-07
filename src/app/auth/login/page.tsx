"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { APP_DOMAIN, ROUTES } from "@/lib/constants";

const OAUTH_IN_FLIGHT_KEY = "portfolio_oauth_in_flight";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const redirectToIAM = async () => {
    if (inFlight.current) return;
    if (sessionStorage.getItem(OAUTH_IN_FLIGHT_KEY) === "true") return;

    inFlight.current = true;
    sessionStorage.setItem(OAUTH_IN_FLIGHT_KEY, "true");

    try {
      const response = await authClient.signIn.oauth2({
        providerId: "portfolio",
        callbackURL: `${APP_DOMAIN}${ROUTES.DASHBOARD}`,
      });

      if (response.error) {
        setError(response.error.message ?? "SSO sign-in failed.");
        toast.error(response.error.message ?? "SSO sign-in failed.");
        sessionStorage.removeItem(OAUTH_IN_FLIGHT_KEY);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
      toast.error(message);
      sessionStorage.removeItem(OAUTH_IN_FLIGHT_KEY);
    } finally {
      inFlight.current = false;
    }
  };

  useEffect(() => {
    sessionStorage.removeItem(OAUTH_IN_FLIGHT_KEY);

    authClient.getSession().then(({ data: session }) => {
      if (session?.user) {
        window.location.href = `${APP_DOMAIN}${ROUTES.DASHBOARD}`;
        return;
      }
      redirectToIAM();
    });
  }, []);

  const handleRetry = () => {
    setError(null);
    sessionStorage.removeItem(OAUTH_IN_FLIGHT_KEY);
    redirectToIAM();
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-6 p-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            Redirecting to iam.digitalcovet.com to authenticate...
          </p>
        </div>
        <div className="flex justify-center">
          <svg
            className="h-8 w-8 animate-spin text-primary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            role="img"
            aria-label="Loading"
          >
            <title>Redirecting to IAM</title>
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
        </div>
        {error && (
          <div className="space-y-4 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
