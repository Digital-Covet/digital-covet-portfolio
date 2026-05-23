"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { unlockShare } from "./_actions";

export function UnlockForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await unlockShare(token, password);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to unlock");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-3">
      <div className="space-y-2">
        <Label htmlFor="pw">Password</Label>
        <Input
          id="pw"
          type="password"
          autoFocus
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isPending}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Unlocking…" : "Unlock"}
      </Button>
    </form>
  );
}
