"use client";

import {
  ArrowLeftIcon,
  CheckIcon,
  CopyIcon,
  ShieldIcon,
  ShieldWarningIcon,
  SpinnerIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { getExistingInviteUrl } from "@/actions/invite";
import { createAdminUser } from "@/actions/user";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WORK_EMAIL_DOMAIN } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface InviteAdminFormProps {
  currentUserRole: string;
}
export function InviteAdminForm({ currentUserRole }: InviteAdminFormProps) {
  const [name, setName] = useState("");
  const [workEmailPrefix, setWorkEmailPrefix] = useState("");
  const [role, setRole] = useState<"admin" | "superadmin">("admin");
  const [isLoading, setIsLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const workEmail = workEmailPrefix
    ? `${workEmailPrefix}${WORK_EMAIL_DOMAIN}`
    : "";

  // ── Submit handler ──────────────────────────────────────────────────

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter the user's full name.");
      return;
    }
    if (!workEmailPrefix) {
      toast.error("Please enter a work email username.");
      return;
    }

    setIsLoading(true);
    setInviteUrl(null);

    try {
      const result = await createAdminUser({
        name: name.trim(),
        email: workEmail,
        role,
      });

      if (!result.ok) {
        if (result.error.includes("already exists")) {
          toast.error(result.error);
          const existingUrl = await fetchExistingInvite(workEmail);
          if (existingUrl) setInviteUrl(existingUrl);
        } else {
          toast.error(result.error);
        }
      } else {
        setInviteUrl(result.data.inviteUrl);
        toast.success(
          "Account created. Invitation email is sending in the background.",
        );
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
      console.error("[InviteAdminForm] Unexpected error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Fetch existing invite URL ────────────────────────────────────────

  const fetchExistingInvite = async (email: string): Promise<string | null> => {
    try {
      const result = await getExistingInviteUrl(email);
      if (!result.ok) {
        toast.error(`Could not retrieve existing invite: ${result.error}`);
        return null;
      }
      return result.data.inviteUrl;
    } catch (err) {
      toast.error("Network error while fetching existing invite.");
      console.error("[InviteAdminForm] fetchExistingInvite error:", err);
      return null;
    }
  };

  // ── Copy invite link ─────────────────────────────────────────────────

  const handleCopy = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success("Invite link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  // ── Reset form ───────────────────────────────────────────────────────

  const handleReset = () => {
    setName("");
    setWorkEmailPrefix("");
    setRole("admin");
    setInviteUrl(null);
    setCopied(false);
  };

  // ── Render: Success state ─────────────────────────────────────────────

  if (inviteUrl) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <Button
            variant="ghost"
            size="sm"
            render={
              <Link href="/users">
                <ArrowLeftIcon size={16} />
                Back to User List
              </Link>
            }
            className="gap-1.5"
          ></Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Invitation Created!</CardTitle>
            <CardDescription>
              Account created for{" "}
              <span className="font-medium">{workEmail}</span> with role{" "}
              <span className="font-medium">
                {role === "superadmin" ? "Super Admin" : "Admin"}
              </span>
              . Share the link below so they can set their password and activate
              the account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 border bg-muted/50 p-4">
              <p className="text-sm font-medium">Invite link:</p>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={inviteUrl}
                  className="flex-1 font-mono text-xs"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  className="shrink-0"
                  aria-label="Copy invite link"
                >
                  {copied ? (
                    <CheckIcon size={16} className="text-emerald-600" />
                  ) : (
                    <CopyIcon size={16} />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                onClick={handleReset}
                variant="outline"
                className="flex-1"
              >
                Create another invitation
              </Button>
              <Button
                render={<Link href="/admin/users">Back to User List</Link>}
                className="flex-1"
              ></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Render: Form state ────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          render={
            <Link href="/users">
              <ArrowLeftIcon size={16} />
              Back to User List
            </Link>
          }
          className="gap-1.5"
        ></Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invite admin user</CardTitle>
          <CardDescription>
            Create a new account with elevated privileges. The invitation email
            will be sent to the personal address so the user can set their
            password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ── Name ──────────────────────────────────────────────── */}
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {/* ── Work email ────────────────────────────────────────── */}
            <div className="space-y-2">
              <Label htmlFor="workEmail">Work email</Label>
              <div className="flex">
                <Input
                  id="workEmail"
                  type="text"
                  placeholder="jane"
                  value={workEmailPrefix}
                  onChange={(e) =>
                    setWorkEmailPrefix(
                      e.target.value.toLowerCase().replace(/[^a-z0-9.]/g, ""),
                    )
                  }
                  required
                  disabled={isLoading}
                  className="flex-1 "
                />
                <span className="inline-flex items-center border border-l-0 bg-muted px-3 text-sm text-muted-foreground">
                  {WORK_EMAIL_DOMAIN}
                </span>
              </div>
            </div>

            {/* ── Role ──────────────────────────────────────────────── */}
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={role}
                onValueChange={(value) =>
                  setRole(value as "admin" | "superadmin")
                }
                disabled={isLoading}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <span className="flex items-center gap-2">
                      <ShieldIcon size={16} className="text-amber-500" />
                      Admin
                    </span>
                  </SelectItem>
                  {currentUserRole === "superadmin" && (
                    <SelectItem value="superadmin">
                      <span className="flex items-center gap-2">
                        <ShieldWarningIcon
                          size={16}
                          className="text-destructive"
                        />
                        Super Admin
                      </span>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {currentUserRole !== "superadmin" && (
                <p className="text-xs text-muted-foreground">
                  Only superadmins can create superadmin users.
                </p>
              )}
            </div>

            {/* ── Submit ────────────────────────────────────────────── */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <SpinnerIcon size={16} className="mr-2 animate-spin" />
                  Creating…
                </>
              ) : (
                "Send invitation"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
