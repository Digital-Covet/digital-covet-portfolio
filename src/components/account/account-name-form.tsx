"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateAccountName } from "@/actions/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

interface AccountNameFormProps {
  currentName: string;
}

export function AccountNameForm({ currentName }: AccountNameFormProps) {
  const [name, setName] = useState(currentName);

  const [isPending, startTransition] = useTransition();

  const { refetch } = authClient.useSession();

  const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      const result = await updateAccountName({ name });

      if (!result.ok) {
        toast.error(result.error?.message ?? "Failed to update name");
        return;
      }

      await refetch();

      toast.success("Name updated successfully");
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-xl font-semibold">Full name</h3>

        <p className="text-sm text-muted-foreground">
          Update the display name visible across your account.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
        <div className="space-y-2">
          <Label htmlFor="name">Display name</Label>

          <Input
            id="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your display name"
            className="h-12"
            maxLength={50}
            required
          />
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={isPending}
          className="min-w-[160px]"
        >
          {isPending ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
