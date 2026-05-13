import { cookies } from "next/headers";
import { z } from "zod";
import type { AuthUser, UserRole } from "@/types/auth.types";
import { auth } from "./auth";

const UserRoleSchema = z
  .enum(["employee", "admin", "superadmin"])
  .catch("employee");

const ROLE_LEVEL: Record<UserRole, number> = {
  employee: 0,
  admin: 1,
  superadmin: 2,
};

async function buildSessionHeaders(): Promise<Headers> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");
  return new Headers({ cookie: cookieHeader });
}

export async function getSession() {
  const headers = await buildSessionHeaders();

  if (!headers.get("cookie")) return null;
  return auth.api.getSession({ headers });
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getSession();
  if (!session?.user) return null;

  const u = session.user;

  return {
    id: u.id,
    email: u.email,
    name: u.name,
    image: (u.image as string | null | undefined) ?? null,

    role: UserRoleSchema.parse(u.role),
    departmentId: (u.departmentId as string | null | undefined) ?? null,
    emailVerified: u.emailVerified ?? false,
    twoFactorEnabled: u.twoFactorEnabled ?? false,

    passwordChanged: (u.passwordChanged as boolean | undefined) ?? false,
  };
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function requireRole(minRole: UserRole): Promise<AuthUser> {
  const user = await requireUser();
  if (ROLE_LEVEL[user.role] < ROLE_LEVEL[minRole]) {
    throw new Error("FORBIDDEN");
  }
  return user;
}
