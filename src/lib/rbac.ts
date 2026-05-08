import { prisma } from "@/db";
import type { AuthUser, UserRole } from "@/types/auth.types";

export async function getDeptUserIds(deptId: string): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: { departmentId: deptId },
    select: { id: true },
  });
  return users.map((u) => u.id);
}

export type CreatedByScalarFilter =
  | { createdBy: string }
  | { createdBy: { in: string[] } }
  | undefined;

export async function buildCreatedByFilter(
  authUser: AuthUser,
  getDeptUserIds: (deptId: string) => Promise<string[]>,
): Promise<CreatedByScalarFilter> {
  if (authUser.role === "superadmin") return undefined;

  if (authUser.role === "admin") {
    if (!authUser.departmentId) return undefined;
    const userIds = await getDeptUserIds(authUser.departmentId);
    return { createdBy: { in: userIds } };
  }

  return { createdBy: authUser.id };
}

export function canMutateRecord(
  authUser: AuthUser,
  recordCreatedBy: string | null,
): boolean {
  if (authUser.role === "superadmin") return true;
  if (!recordCreatedBy) return false;
  return recordCreatedBy === authUser.id;
}

export type UserListFilter =
  | { id: string }
  | { id: { in: string[] } }
  | { departmentId: string }
  | undefined;

export async function buildUserListFilter(authUser: {
  id: string;
  role: UserRole;
  departmentId: string | null;
}): Promise<UserListFilter> {
  if (authUser.role === "superadmin") return undefined;

  if (authUser.role === "admin") {
    if (!authUser.departmentId) return undefined;
    return { departmentId: authUser.departmentId };
  }

  return { id: authUser.id };
}
