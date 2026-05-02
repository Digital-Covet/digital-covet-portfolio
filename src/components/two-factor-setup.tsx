"use client";

import { useCallback, useEffect, useState } from "react";
import QRCodePkg from "react-qr-code";
import { toast } from "sonner";
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

interface TwoFactorSetupProps {
  onComplete: () => void;
}

type SetupPhase = "password" | "loading" | "scan" | "verify" | "backup";

const QRCode = (QRCodePkg as any).default ?? QRCodePkg;

function ClientOnlyQRCode({
  value,
  size = 200,
}: {
  value: string;
  size?: number;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted || !value) {
    return (
      <div className="h-50 w-50 flex items-center justify-center bg-muted">
        Loading QR...
      </div>
    );
  }
  return <QRCode value={value} size={size} />;
}

function PasswordPhase({ onSubmit }: { onSubmit: (password: string) => void }) {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!password) {
      toast.error("Please enter your password.");
      return;
    }
    setSubmitting(true);
    try {
      onSubmit(password);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Verify your identity</CardTitle>
        <CardDescription>
          Enter your password to set up two-factor authentication.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoFocus
              disabled={submitting}
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Verifying..." : "Continue"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function LoadingPhase() {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">
          Setting up two-factor authentication…
        </p>
      </CardContent>
    </Card>
  );
}

function ScanPhase({
  totpURI,
  onProceed,
}: {
  totpURI: string;
  onProceed: () => void;
}) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Set up Two-Factor Authentication</CardTitle>
        <CardDescription>
          Scan the QR code below with your authenticator app, then enter the
          6-digit code.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex justify-center bg-white p-6 border">
          <ClientOnlyQRCode value={totpURI} />
        </div>
        <div className="text-center text-xs text-muted-foreground">
          Can't scan the code? Use the URI below for manual entry in your app:
        </div>
        <code className="break-all select-all  bg-muted p-3 text-xs font-mono text-center">
          {totpURI}
        </code>
        <Button onClick={onProceed} variant="outline" className="w-full">
          I've scanned the code →
        </Button>
      </CardContent>
    </Card>
  );
}

function VerifyPhase({
  onVerify,
  onBack,
}: {
  onVerify: (code: string) => Promise<void>;
  onBack: () => void;
}) {
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }
    setSubmitting(true);
    try {
      await onVerify(code);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Confirm setup</CardTitle>
        <CardDescription>
          Enter the 6-digit code from your authenticator app.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="totp-code">Authentication Code</Label>
            <Input
              id="totp-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="123456"
              className="text-center text-lg tracking-[0.5em] font-mono"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              autoFocus
              autoComplete="one-time-code"
              disabled={submitting}
            />
            <p className="text-xs text-muted-foreground">
              Code refreshes every 30 seconds.
            </p>
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={submitting || code.length !== 6}
          >
            {submitting ? "Verifying…" : "Confirm & Enable 2FA"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={onBack}
          >
            ← Back to QR code
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function BackupPhase({
  backupCodes,
  onComplete,
}: {
  backupCodes: string[];
  onComplete: () => void;
}) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(backupCodes.join("\n"));
      toast.success("Backup codes copied!");
    } catch {
      toast.error("Failed to copy codes. Please copy them manually.");
    }
  };

  const handleDownload = () => {
    const content = `Digital Covet - Two-Factor Authentication Backup Codes\nGenerated: ${new Date().toISOString()}\n\n${backupCodes.join("\n")}\n\nKeep these codes safe. Each code can only be used once.`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "2fa-backup-codes.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Backup codes downloaded!");
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Save your backup codes</CardTitle>
        <CardDescription>
          These one-time codes allow access if you lose your authenticator.
          Store them securely.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 p-4 bg-muted font-mono text-sm">
          {backupCodes.map((code, i) => (
            <div key={i} className="text-center py-1 bg-background ">
              {code}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={handleCopy} variant="outline">
            Copy all codes
          </Button>
          <Button onClick={handleDownload} variant="outline">
            Download codes
          </Button>
        </div>
        <Button onClick={onComplete} className="w-full">
          I've saved them — Continue to dashboard
        </Button>
      </CardContent>
    </Card>
  );
}

export function TwoFactorSetup({ onComplete }: TwoFactorSetupProps) {
  const [phase, setPhase] = useState<SetupPhase>("password");
  const [password, setPassword] = useState("");
  const [totpURI, setTotpURI] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const handlePasswordSubmit = (submittedPassword: string) => {
    setPassword(submittedPassword);
    setPhase("loading");
  };

  const initialize = useCallback(async () => {
    try {
      const { data, error } = await authClient.twoFactor.enable({
        password,
      });
      if (error) {
        throw new Error(error.message ?? "Failed to generate setup URI");
      }
      setTotpURI(data.totpURI);
      if (data?.backupCodes) {
        setBackupCodes(data.backupCodes);
      }
      setPhase("scan");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to initialise 2FA setup",
      );
      setPhase("password");
    }
  }, [password]);

  useEffect(() => {
    if (phase === "loading") {
      initialize();
    }
  }, [phase, initialize]);

  const handleVerify = async (code: string) => {
    try {
      const { error } = await authClient.twoFactor.verifyTotp({ code });
      if (error) {
        throw new Error(error.message ?? "Verification failed");
      }
      setPhase("backup");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Invalid code. Please try again.",
      );
      throw err;
    }
  };

  switch (phase) {
    case "password":
      return <PasswordPhase onSubmit={handlePasswordSubmit} />;
    case "loading":
      return <LoadingPhase />;
    case "scan":
      return (
        <ScanPhase totpURI={totpURI} onProceed={() => setPhase("verify")} />
      );
    case "verify":
      return (
        <VerifyPhase onVerify={handleVerify} onBack={() => setPhase("scan")} />
      );
    case "backup":
      return <BackupPhase backupCodes={backupCodes} onComplete={onComplete} />;
    default:
      return null;
  }
}
