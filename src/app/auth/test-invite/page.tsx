"use client";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { getExistingInviteUrl, testInviteEmployee } from "@/actions/invite";
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
  const [personalEmail, setPersonalEmail] = useState("");
  const [workEmailPrefix, setWorkEmailPrefix] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  const workEmail = workEmailPrefix
    ? `${workEmailPrefix}${WORK_EMAIL_DOMAIN}`
    : "";

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!personalEmail) {
      toast.error("Please enter a personal email address.");
      return;
    }
    if (!workEmailPrefix) {
      toast.error("Please enter a work email username.");
      return;
    }

    setIsLoading(true);
    setInviteUrl(null);

    try {
      const actionResult = await testInviteEmployee(personalEmail, workEmail);

      if (!actionResult.ok) {
        if (actionResult.error.includes("already exists")) {
          toast.error(actionResult.error);
          const existingUrl = await getExistingInvite(workEmail);
          if (existingUrl) setInviteUrl(existingUrl);
        } else {
          toast.error(actionResult.error);
        }
      } else {
        setInviteUrl(actionResult.data.inviteUrl);
        toast.success(
          "Invitation created. Email is sending in the background.",
        );
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
      console.error("[TestInvitePage] Unexpected error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getExistingInvite = async (email: string): Promise<string | null> => {
    try {
      const result = await getExistingInviteUrl(email);
      if (!result.ok) {
        toast.error(`Could not retrieve existing invite: ${result.error}`);
        return null;
      }
      return result.data.inviteUrl;
    } catch (err) {
      toast.error("Network error while fetching existing invite.");
      console.error("[TestInvitePage] getExistingInvite error:", err);
      return null;
    }
  };

  const handleReset = () => {
    setPersonalEmail("");
    setWorkEmailPrefix("");
    setInviteUrl(null);
  };

  if (inviteUrl) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invitation Created!</CardTitle>
            <CardDescription>
              Account created for{" "}
              <span className="font-medium">{workEmail}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 space-y-2">
              <p className="font-medium">Invite link:</p>
              <Link
                href={inviteUrl}
                className="bg-muted block hover:underline break-all"
                target="_blank"
                rel="noopener noreferrer"
              >
                {inviteUrl}
              </Link>
            </div>
            <Button onClick={handleReset} variant="outline" className="w-full">
              Create another invitation
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Invite employee</CardTitle>
          <CardDescription>
            Create a new employee account. The invitation email will be sent to
            the personal address.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="personalEmail">Personal email</Label>
              <Input
                id="personalEmail"
                type="email"
                placeholder="john@gmail.com"
                value={personalEmail}
                onChange={(e) => setPersonalEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workEmail">Work email</Label>
              <div className="flex">
                <Input
                  id="workEmail"
                  type="text"
                  placeholder="john"
                  value={workEmailPrefix}
                  onChange={(e) =>
                    setWorkEmailPrefix(
                      e.target.value.toLowerCase().replace(/[^a-z0-9.]/g, ""),
                    )
                  }
                  required
                />
                <span className="flex items-center bg-muted px-3 text-sm text-muted-foreground">
                  {WORK_EMAIL_DOMAIN}
                </span>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating…" : "Send invitation"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
