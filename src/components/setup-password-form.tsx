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
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
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
            <PasswordInput
              id="newPassword"
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
            <PasswordInput
              id="confirmPassword"
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
