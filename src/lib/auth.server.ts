import crypto from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/db";
import type { UserRole } from "@/types/auth.types";
import { auth } from "./auth";

const ROLE_LEVEL: Record<UserRole, number> = {
  employee: 0,
  admin: 1,
  superadmin: 2,
};

export async function getSession() {
  const cookieStore = await cookies();
  const sessionToken =
    cookieStore.get("better-auth.session_token")?.value ??
    cookieStore.get("__Secure-better-auth.session_token")?.value ??
    null;

  if (!sessionToken) return null;
  const headers = new Headers();
  headers.set("cookie", `better-auth.session_token=${sessionToken}`);
  return auth.api.getSession({ headers });
}

export async function getCurrentUser(): Promise<{
  id: string;
  email: string;
  name: string;
  role: UserRole;
  departmentId: string | null;
  twoFactorEnabled: boolean;
} | null> {
  const session = await getSession();
  if (!session?.user) return null;

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: (session.user.role as UserRole) ?? "employee",
    departmentId:
      (session.user.departmentId as string | null | undefined) ?? null,
    twoFactorEnabled: session.user.twoFactorEnabled ?? false,
  };
}

export async function requireUser() {
  const u = await getCurrentUser();
  if (!u) throw new Error("UNAUTHORIZED");
  return u;
}

export async function requireRole(minRole: UserRole) {
  const u = await requireUser();
  if (ROLE_LEVEL[u.role] < ROLE_LEVEL[minRole]) {
    throw new Error("FORBIDDEN");
  }
  return u;
}

export async function checkEmailAvailable(email: string): Promise<boolean> {
  const existing = await prisma.user.findFirst({
    where: { email },
    select: { id: true },
  });
  return !existing;
}

export function generateToken(length: number = 24): string {
  return crypto.randomBytes(length).toString("hex");
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 100_000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const [salt, hash] = storedHash.split(":");
  const verifyHash = crypto
    .pbkdf2Sync(password, salt, 100_000, 64, "sha512")
    .toString("hex");
  return hash === verifyHash;
}
