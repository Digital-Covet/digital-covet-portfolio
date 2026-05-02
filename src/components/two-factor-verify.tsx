"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

interface TwoFactorVerifyProps {
  redirectTo?: string;
}

type AuthMode = "totp" | "backup";

export default function TwoFactorVerify({
  redirectTo = "/dashboard",
}: TwoFactorVerifyProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("totp");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const validateInput = (): boolean => {
    if (mode === "totp") {
      return /^\d{6}$/.test(code);
    }
    return code.trim().length >= 8;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (cooldown > 0) return;

    if (!validateInput()) {
      setError(
        mode === "totp"
          ? "Please enter a valid 6-digit code."
          : "Please enter a valid backup code.",
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let response: any;

      if (mode === "totp") {
        response = await authClient.twoFactor.verifyTotp({
          code,
          trustDevice: false,
        });
      } else {
        response = await authClient.twoFactor.verifyBackupCode({
          code,
          trustDevice: false,
        });
      }

      if (response.error) {
        throw new Error(response.error.message ?? "Verification failed");
      }

      toast.success("Verification successful!");

      router.refresh();
      router.push(redirectTo);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Invalid code. Please try again.";
      setError(message);
      setCooldown(5);
      setCode("");
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode((prev) => (prev === "totp" ? "backup" : "totp"));
    setCode("");
    setError(null);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="code">
            {mode === "totp" ? "Authenticator code" : "Backup code"}
          </Label>
          <Input
            id="code"
            type="text"
            inputMode={mode === "totp" ? "numeric" : "text"}
            autoComplete={mode === "totp" ? "one-time-code" : "off"}
            maxLength={mode === "totp" ? 6 : 24}
            value={code}
            onChange={(e) => setCode(e.target.value.trim())}
            disabled={isLoading || cooldown > 0}
            placeholder={
              mode === "totp" ? "000000" : "8+ character backup code"
            }
            className="font-mono"
          />
        </div>

        {error && (
          <p className="bg-red-50 p-3 text-sm text-red-600 border border-red-100">
            {error}
          </p>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || cooldown > 0 || code.length === 0}
        >
          {isLoading
            ? "Verifying..."
            : cooldown > 0
              ? `Try again in ${cooldown}s`
              : "Verify code"}
        </Button>
      </form>

      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Having trouble?
          </span>
        </div>
      </div>

      <Button
        type="button"
        variant="ghost"
        onClick={toggleMode}
        className="w-full text-sm border-accent-foreground"
      >
        {mode === "totp"
          ? "Use a backup code instead"
          : "Use authenticator app instead"}
      </Button>
    </div>
  );
}
