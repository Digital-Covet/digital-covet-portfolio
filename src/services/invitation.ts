"use server";
import crypto from "node:crypto";
import { prisma } from "@/db";
import { auth } from "@/lib/auth";
import { buildInviteUrl, INVITATION_EXPIRY_DAYS, ROLES } from "@/lib/constants";
import type { UserRole } from "@/types/auth.types";

function generateSecurePassword(): string {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  let i = 0;
  while (i < 16) {
    const byte = crypto.randomBytes(1)[0];
    if (byte >= 256 - (256 % charset.length)) continue;
    password += charset[byte % charset.length];
    i++;
  }
  return password;
}

export async function createUserAndInvite(
  workEmail: string,
  role: string = ROLES.EMPLOYEE,
  invitedBy?: string,
) {
  // We must generate a password to satisfy the auth provider, but it is NEVER shared with the user.
  const presetPassword = generateSecurePassword();
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(
    Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  );

  const newUserResponse = await auth.api.createUser({
    body: {
      email: workEmail,
      password: presetPassword,
      name: workEmail.split("@")[0],
      role: role as "employee" | "admin" | "superadmin",
    },
  });

  const user = (newUserResponse as any)?.user ?? newUserResponse;
  if (!user) {
    throw new Error("Failed to provision the user account.");
  }

  // Transaction ensures atomicity
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, passwordChanged: false },
    }),
    prisma.invitation.create({
      data: {
        email: workEmail,
        token,
        role: role as UserRole,
        invitedBy,
        expiresAt,
      },
    }),
  ]);

  return { userId: user.id, token, inviteUrl: buildInviteUrl(token) };
}

export async function resetInvitation(
  workEmail: string,
  userId: string,
  role: string = ROLES.EMPLOYEE,
  invitedBy?: string,
) {
  const presetPassword = generateSecurePassword();
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(
    Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  );

  await prisma.$transaction([
    prisma.invitation.updateMany({
      where: { email: workEmail, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.invitation.create({
      data: {
        email: workEmail,
        token,
        role: role as UserRole,
        invitedBy,
        expiresAt,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { passwordChanged: false },
    }),
  ]);

  const ctx = await auth.$context;
  const hash = await ctx.password.hash(presetPassword);
  await ctx.internalAdapter.updatePassword(userId, hash);

  return { token, inviteUrl: buildInviteUrl(token) };
}
