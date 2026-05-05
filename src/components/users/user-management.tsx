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
import { deleteUser, type UserListItem } from "@/actions/user";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface UserManagementProps {
  initialUsers: UserListItem[];
  currentUserId: string;
  currentUserRole: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function UserManagement({
  initialUsers,
  currentUserId,
}: UserManagementProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // ── Delete dialog state ──────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<UserListItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteUser({ id: deleteTarget.id });
      if (result.ok) {
        setDeleteTarget(null);
        toast.success("User deleted successfully");
        router.refresh();
      } else {
        setDeleteError(result.error);
      }
    });
  }, [deleteTarget, router]);

  // ── Badge helpers ─────────────────────────────────────────────────────

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

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-6">
      {/* ─── Header ──────────────────────────────────────────────────── */}
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

      {/* ─── Data Table ──────────────────────────────────────────────── */}
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
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{getStatusBadge(user.banned)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    {user.id !== currentUserId ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => {
                          setDeleteError(null);
                          setDeleteTarget(user);
                        }}
                        disabled={isPending}
                      >
                        <TrashSimpleIcon size={16} />
                        Delete
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">You</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ─── Delete Confirmation ─────────────────────────────────────── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget?.name}
              </span>{" "}
              ({deleteTarget?.email})? This action is permanent and cannot be
              undone. All associated sessions, accounts, and data will be
              removed.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deleteError && (
            <div className="border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              {deleteError}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? (
                <>
                  <SpinnerIcon size={16} className="mr-2 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete User"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
