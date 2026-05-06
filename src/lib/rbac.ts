import { prisma } from "@/db";

export interface AuthUser {
  id: string;
  role: string | null;
  departmentId: string | null;
}

export type CreatedByScalarFilter =
  | { createdBy: string }
  | { createdBy: { in: string[] } }
  | undefined;

export async function buildCreatedByFilter(
  authUser: AuthUser,
): Promise<CreatedByScalarFilter> {
  if (authUser.role === "superadmin") {
    return undefined;
  }

  if (authUser.role === "admin") {
    if (!authUser.departmentId) {
      return undefined;
    }

    const deptUsers = await prisma.user.findMany({
      where: { departmentId: authUser.departmentId },
      select: { id: true },
    });

    return { createdBy: { in: deptUsers.map((u) => u.id) } };
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

export async function buildUserListFilter(
  authUser: AuthUser,
): Promise<UserListFilter> {
  if (authUser.role === "superadmin") return undefined;

  if (authUser.role === "admin") {
    if (!authUser.departmentId) return undefined;
    return { departmentId: authUser.departmentId };
  }

  return { id: authUser.id };
}
