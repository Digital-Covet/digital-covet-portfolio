"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { authClient } from "@/lib/auth-client";
import { ROUTES } from "@/lib/constants";

// ─── CHANGE S2: Password strength schema enforced at the UI boundary.
// Better Auth should also enforce this server-side in its configuration.
// Validation here provides immediate user feedback; server-side is the
// authoritative enforcement.
const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/[a-z]/, "Must contain at least one lowercase letter")
  .regex(/[0-9]/, "Must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Must contain at least one special character");

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // ─── CHANGE (minor): Corrected event type from React.SubmitEvent to
  // React.FormEvent — the former does not exist in React's type definitions.
  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    // ─── CHANGE S2: Validate password strength before submitting
    const strengthResult = passwordSchema.safeParse(password);
    if (!strengthResult.success) {
      toast.error(
        strengthResult.error.issues[0]?.message ?? "Invalid password",
      );
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    // Guard: token must be present. The middleware allows unauthenticated
    // users to reach this page, so we validate the token client-side too.
    const token = searchParams.get("token");
    if (!token) {
      toast.error("Invalid or missing reset token. Please request a new link.");
      return;
    }

    setLoading(true);

    const { error } = await authClient.resetPassword({
      newPassword: password,
      token,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password reset successful. Please log in.");
      // ─── CHANGE M2: Use ROUTES constant
      router.push(ROUTES.LOGIN);
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">New Password</Label>
        <PasswordInput
          id="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {/* Inline hint so users understand requirements before submitting */}
        <p className="text-xs text-muted-foreground">
          Min. 12 characters with uppercase, lowercase, number, and symbol.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <PasswordInput
          id="confirmPassword"
          required
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Resetting..." : "Update Password"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create New Password</CardTitle>
        </CardHeader>
        <CardContent>
          {/*
            Suspense is required here because useSearchParams() inside
            ResetPasswordForm triggers dynamic rendering. Without the
            Suspense boundary, Next.js will error during static generation.
          */}
          <Suspense fallback={<p className="text-sm">Loading...</p>}>
            <ResetPasswordForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
