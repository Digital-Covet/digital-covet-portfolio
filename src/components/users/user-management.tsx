"use client";
import {
  PlusIcon,
  ShieldIcon,
  ShieldWarningIcon,
  SpinnerIcon,
  TrashSimpleIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteUser, updateUserRole, type UserListItem } from "@/actions/user";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { authClient } from "@/lib/auth-client";
import { Label } from "../ui/label";

type DeleteStep = "confirm" | "verify";
interface UserManagementProps {
  initialUsers: UserListItem[];
  currentUserId: string;
  currentUserRole: string;
}
export function UserManagement({
  initialUsers,
  currentUserId,
  currentUserRole,
}: UserManagementProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<UserListItem | null>(null);
  const [deleteStep, setDeleteStep] = useState<DeleteStep>("confirm");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [transferUserId, setTransferUserId] = useState<string>("");
  const [otp, setOtp] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);

  // Helper function to determine if the current user can delete a target user
  const canDeleteUser = useCallback(
    (targetUser: UserListItem) => {
      // Rule 1: A user cannot delete themselves
      if (targetUser.id === currentUserId) {
        return false;
      }

      // Rule 3: A superadmin can delete any user except themselves
      if (currentUserRole === "superadmin") {
        return true;
      }

      // Rule 2: An admin cannot delete admin or superadmin users.
      // (They can only delete employee users within their department.
      // Because `listUsers` already filters the data to employees in their department,
      // we only need to verify the role restriction on the client side.)
      if (currentUserRole === "admin") {
        return targetUser.role !== "admin" && targetUser.role !== "superadmin";
      }

      // Employees cannot delete anyone
      return false;
    },
    [currentUserId, currentUserRole],
  );

  const handleSendOtp = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    setSendingOtp(true);
    const adminUser = initialUsers.find((u) => u.id === currentUserId);
    if (!adminUser?.email) {
      setDeleteError("Could not determine your email address.");
      setSendingOtp(false);
      return;
    }
    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email: adminUser.email,
        type: "sign-in",
      });
      if (error) {
        setDeleteError(
          error.message ||
          "Failed to send verification code. Please try again.",
        );
        setSendingOtp(false);
        return;
      }
      setDeleteStep("verify");
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Failed to send verification code. Please try again.",
      );
    } finally {
      setSendingOtp(false);
    }
  }, [deleteTarget, initialUsers, currentUserId]);
  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteUser({
        id: deleteTarget.id,
        transferToUserId: transferUserId || undefined,
        otp,
      });
      if (result.ok) {
        setDeleteTarget(null);
        setDeleteStep("confirm");
        setTransferUserId("");
        setOtp("");
        toast.success("User deleted successfully");
        router.refresh();
      } else {
        setDeleteError(result.error);
      }
    });
  }, [deleteTarget, transferUserId, otp, router]);
  const resetDeleteState = useCallback(() => {
    setDeleteTarget(null);
    setDeleteStep("confirm");
    setTransferUserId("");
    setOtp("");
    setDeleteError(null);
    setSendingOtp(false);
  }, []);
  const handleRoleChange = useCallback(
    (userId: string, newRole: string) => {
      setUpdatingRoleId(userId);
      startTransition(async () => {
        const result = await updateUserRole({
          userId,
          newRole: newRole as "employee" | "admin" | "superadmin",
        });
        if (result.ok) {
          toast.success(`Role updated to ${newRole}`);
          router.refresh();
        } else {
          toast.error(result.error);
        }
        setUpdatingRoleId(null);
      });
    },
    [router],
  );
  const getRoleBadge = (role: string | null) => {
    switch (role) {
      case "superadmin":
        return (
          <Badge variant="destructive" className="gap-1">
            <ShieldWarningIcon size={16} />
            Super Admin
          </Badge>
        );
      case "admin":
        return (
          <Badge
            variant="outline"
            className="gap-1 border-amber-500 text-amber-600 dark:text-amber-400"
          >
            <ShieldIcon size={16} />
            Admin
          </Badge>
        );
      default:
        return <Badge variant="secondary">Employee</Badge>;
    }
  };
  const getStatusBadge = (banned: boolean | null) => {
    return banned ? (
      <Badge variant="destructive">Banned</Badge>
    ) : (
      <Badge
        variant="outline"
        className="border-emerald-500 text-emerald-600 dark:text-emerald-400"
      >
        Active
      </Badge>
    );
  };
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  const adminEmail = initialUsers.find((u) => u.id === currentUserId)?.email;
  const canChangeRole = currentUserRole === "superadmin";
  return (
    <div className="space-y-6 p-6">
      {}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-primary/10">
            <UsersIcon size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              User Management
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage admin and superadmin accounts
            </p>
          </div>
        </div>
        <Button
          render={
            <Link href="/users/invite">
              <PlusIcon size={16} />
              Add User
            </Link>
          }
          className="gap-2"
          nativeButton={false}
        ></Button>
      </div>
      {}
      <div className="border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              initialUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    {canChangeRole && user.id !== currentUserId ? (
                      <Select
                        value={user.role ?? "employee"}
                        disabled={updatingRoleId === user.id}
                        onValueChange={(newRole) =>
                          newRole && handleRoleChange(user.id, newRole)
                        }
                      >
                        <SelectTrigger className="h-8 w-[150px]">
                          {updatingRoleId === user.id ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <SpinnerIcon size={14} className="animate-spin" />
                              <span className="text-xs">Updating…</span>
                            </div>
                          ) : (
                            <SelectValue />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employee">Employee</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="superadmin">
                            Super Admin
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      getRoleBadge(user.role)
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(user.banned)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    {user.id === currentUserId ? (
                      <span className="text-xs text-muted-foreground">You</span>
                    ) : canDeleteUser(user) ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => {
                          setDeleteError(null);
                          setTransferUserId("");
                          setOtp("");
                          setDeleteStep("confirm");
                          setSendingOtp(false);
                          setDeleteTarget(user);
                        }}
                        disabled={isPending || sendingOtp}
                      >
                        <TrashSimpleIcon size={16} />
                        Delete
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            resetDeleteState();
          }
        }}
      >
        <AlertDialogContent>
          {deleteStep === "confirm" ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete User</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-foreground">
                    {deleteTarget?.name}
                  </span>{" "}
                  ({deleteTarget?.email})? This action is permanent and cannot
                  be undone. All associated sessions and accounts will be
                  removed. You can optionally transfer their created data to
                  another user.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Transfer data to:</Label>
                <Select
                  value={transferUserId}
                  onValueChange={(v) => v && setTransferUserId(v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a user (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {initialUsers
                      .filter((u) => u.id !== deleteTarget?.id)
                      .map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              {deleteError && (
                <div className="border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                  {deleteError}
                </div>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel disabled={sendingOtp}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    handleSendOtp();
                  }}
                  disabled={sendingOtp}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {sendingOtp ? (
                    <>
                      <SpinnerIcon size={16} className="mr-2 animate-spin" />
                      Sending OTP…
                    </>
                  ) : (
                    "Delete User"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          ) : (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Verify Deletion</AlertDialogTitle>
                <AlertDialogDescription>
                  A 6-digit verification code has been sent to{" "}
                  <span className="font-semibold text-foreground">
                    {adminEmail}
                  </span>
                  . Enter the code below to confirm deletion of{" "}
                  <span className="font-semibold text-foreground">
                    {deleteTarget?.name}
                  </span>
                  .
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-2">
                <Label htmlFor="otp-input" className="text-sm font-medium">
                  Verification Code
                </Label>
                <Input
                  id="otp-input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="text-center text-2xl tracking-[0.5em] font-mono"
                  autoComplete="one-time-code"
                />
              </div>
              {deleteError && (
                <div className="border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                  {deleteError}
                </div>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isPending}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete();
                  }}
                  disabled={isPending || otp.length < 6}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isPending ? (
                    <>
                      <SpinnerIcon size={16} className="mr-2 animate-spin" />
                      Verifying & Deleting…
                    </>
                  ) : (
                    "Verify & Delete"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
