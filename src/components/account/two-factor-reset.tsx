"use client";

import { ShieldWarningIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { disable2FAWithBackupCode } from "@/actions/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TwoFactorReset() {
  const router = useRouter();

  const [backupCode, setBackupCode] = useState("");

  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      const result = await disable2FAWithBackupCode({
        code: backupCode,
      });

      if (!result.ok) {
        toast.error(result.error?.message ?? "Invalid backup code");
        return;
      }

      toast.success("2FA reset successful");

      router.push("/auth/setup-2fa");
    });
  };

  return (
    <div className="border bg-muted/30 p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="border bg-background p-2">
          <ShieldWarningIcon size={16} />
        </div>

        <div>
          <h3 className="font-semibold">Reset Two-Factor Authentication</h3>

          <p className="mt-1 text-sm text-muted-foreground">
            Enter one of your unused backup codes to disable your current
            authenticator.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="backup-code">Backup code</Label>

          <Input
            id="backup-code"
            value={backupCode}
            onChange={(event) => setBackupCode(event.target.value)}
            placeholder="XXXX-XXXX"
            className="h-12"
            required
          />
        </div>

        <Button type="submit" variant="destructive" disabled={isPending}>
          {isPending ? "Verifying..." : "Reset 2FA"}
        </Button>
      </form>
    </div>
  );
}
