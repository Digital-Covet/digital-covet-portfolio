"use client";

import { CheckIcon, CopyIcon, SpinnerIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { testInviteAdmin } from "@/actions/invite";
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
import { WORK_EMAIL_DOMAIN } from "@/lib/constants";

export default function TestInvitePage() {
  const [emailPrefix, setEmailPrefix] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const workEmail = emailPrefix
    ? `${emailPrefix}${WORK_EMAIL_DOMAIN}`
    : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailPrefix) {
      toast.error("Please enter an email username");
      return;
    }

    setIsLoading(true);
    setInviteUrl(null);

    try {
      const result = await testInviteAdmin(workEmail);

      if (!result.ok) {
        toast.error(result.error);
      } else {
        setInviteUrl(result.data.inviteUrl);
        toast.success("Invite created!");
      }
    } catch {
      toast.error("Unexpected error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success("Copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  if (inviteUrl) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Test Invite Ready</CardTitle>
            <CardDescription>
              Admin invite created for{" "}
              <span className="font-medium">{workEmail}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Input readOnly value={inviteUrl} className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={handleCopy}>
                {copied ? (
                  <CheckIcon size={16} className="text-emerald-600" />
                ) : (
                  <CopyIcon size={16} />
                )}
              </Button>
            </div>
            <Button
              onClick={() => {
                setInviteUrl(null);
                setEmailPrefix("");
                setCopied(false);
              }}
              variant="outline"
              className="w-full"
            >
              Create another
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Test Invite (Dev Only)</CardTitle>
          <CardDescription>
            No auth required. Creates an admin invite for testing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Work email</Label>
              <div className="flex">
                <Input
                  placeholder="testuser"
                  value={emailPrefix}
                  onChange={(e) =>
                    setEmailPrefix(
                      e.target.value.toLowerCase().replace(/[^a-z0-9.]/g, ""),
                    )
                  }
                  required
                  disabled={isLoading}
                  className="flex-1"
                />
                <span className="inline-flex items-center border border-l-0 bg-muted px-3 text-sm text-muted-foreground">
                  {WORK_EMAIL_DOMAIN}
                </span>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <SpinnerIcon size={16} className="mr-2 animate-spin" />
                  Creating invite…
                </>
              ) : (
                "Create test invite"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
