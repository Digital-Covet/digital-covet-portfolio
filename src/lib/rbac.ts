import { prisma } from "@/db";

export type CreatedByIdFilter =
  | Record<string, { id: string } | { id: { in: string[] } }>
  | undefined;

export type UserWhereFilter =
  | { id: string }
  | { id: { in: string[] } }
  | { departmentId: string };

interface AuthUser {
  id: string;
  role: string;
  departmentId: string | null;
}

export async function buildCreatedByRbacFilter(
  authUser: AuthUser,
  relationKey: string,
): Promise<CreatedByIdFilter> {
  if (authUser.role === "superadmin") return undefined;

  if (authUser.role === "admin") {
    if (!authUser.departmentId) {
      return { [relationKey]: { id: "__no_match__" } };
    }

    const deptUsers = await prisma.user.findMany({
      where: { departmentId: authUser.departmentId },
      select: { id: true },
    });
    const deptUserIds = deptUsers.map((u) => u.id);

    return { [relationKey]: { id: { in: deptUserIds } } };
  }

  return { [relationKey]: { id: authUser.id } };
}

export async function buildUserListRbacFilter(
  authUser: AuthUser,
): Promise<UserWhereFilter | undefined> {
  if (authUser.role === "superadmin") return undefined;

  if (authUser.role === "admin") {
    if (!authUser.departmentId) return { id: "__no_match__" };
    return { departmentId: authUser.departmentId };
  }

  return { id: authUser.id };
}
