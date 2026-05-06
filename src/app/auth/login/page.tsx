"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { LoginForm } from "@/components/login-form";
import { authClient } from "@/lib/auth-client";
import { ROUTES } from "@/lib/constants";

export default function LoginPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    setSubmitting(true);

    try {
      const response = await authClient.signIn.email({ email, password });

      if (response.error) {
        toast.error(response.error.message ?? "Sign-in failed.");
        return;
      }

      const data = response.data as {
        twoFactorRedirect?: boolean;
      } | null;

      // ─── CHANGE M2: Destination routes use ROUTES constants, not raw strings
      if (data?.twoFactorRedirect === true) {
        router.push(ROUTES.VERIFY_2FA);
        return;
      }

      toast.success("Signed in successfully!");
      router.push(ROUTES.DASHBOARD);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-6 p-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            Enter your credentials to access your account.
          </p>
        </div>
        <LoginForm onSubmit={handleSubmit} submitting={submitting} />
      </div>
    </div>
  );
}
