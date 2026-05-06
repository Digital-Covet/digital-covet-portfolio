"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/db";
import { auth } from "@/lib/auth";
import { buildInviteUrl, ROLES } from "@/lib/constants";
import { buildUserListFilter } from "@/lib/rbac";
import { err, ok, type Result } from "@/lib/result";
import { sendEmail } from "@/services/email";
import { renderInviteEmail } from "@/services/email-templates";

export type UserListItem = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  banned: boolean | null;
  createdAt: string;
};

export async function listUsers(): Promise<{ users: UserListItem[] }> {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session?.user) {
    throw new Error("Unauthorized.");
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, departmentId: true },
  });

  if (
    !currentUser ||
    (currentUser.role !== ROLES.ADMIN && currentUser.role !== ROLES.SUPERADMIN)
  ) {
    throw new Error("Only admins can list users.");
  }

  const rbacFilter = await buildUserListFilter(currentUser);

  const users = await prisma.user.findMany({
    where: rbacFilter ?? {},
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      banned: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    users: users.map((u) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
    })),
  };
}

const createAdminUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.email("A valid email address is required"),
  role: z.enum(["admin", "superadmin"], {
    error: "Role must be admin or superadmin",
  }),
});

interface CreateAdminUserData {
  userId: string;
  inviteUrl: string;
}

export async function createAdminUser(
  input: z.infer<typeof createAdminUserSchema>,
): Promise<Result<CreateAdminUserData>> {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session?.user) {
    return err("Unauthorized.");
  }

  if (
    session.user.role !== ROLES.ADMIN &&
    session.user.role !== ROLES.SUPERADMIN
  ) {
    return err("Only admins can create admin users.");
  }

  if (input.role === "superadmin" && session.user.role !== ROLES.SUPERADMIN) {
    return err("Only superadmins can create superadmin users.");
  }

  const data = createAdminUserSchema.parse(input);

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return err("A user with this email already exists.");
    }

    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email: data.email,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvitation) {
      return err("An active invitation already exists for this email.");
    }

    const userId = crypto.randomUUID();
    const inviteToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.user.create({
        data: {
          id: userId,
          name: data.name,
          email: data.email,
          role: data.role,
          emailVerified: false,
          passwordChanged: false,
        },
      }),
      prisma.invitation.create({
        data: {
          email: data.email,
          token: inviteToken,
          role: data.role,
          expiresAt,
          invitedBy: session.user.id,
        },
      }),
    ]);

    const inviteUrl = buildInviteUrl(inviteToken);

    const targetEmail = data.email;
    fireInviteEmail(targetEmail, data.email, inviteUrl);

    revalidatePath("/admin/users");

    return ok({ userId, inviteUrl });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    console.error("[createAdminUser]", message);
    return err(message);
  }
}

const deleteUserSchema = z.object({
  id: z.string().min(1, "User ID is required"),
});

export async function deleteUser(
  input: z.infer<typeof deleteUserSchema>,
): Promise<Result<{ success: boolean }>> {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session?.user) {
    return err("Unauthorized.");
  }

  if (
    session.user.role !== ROLES.ADMIN &&
    session.user.role !== ROLES.SUPERADMIN
  ) {
    return err("Only admins can delete users.");
  }

  const data = deleteUserSchema.parse(input);

  if (data.id === session.user.id) {
    return err("You cannot delete your own account.");
  }

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: data.id },
      select: { id: true, role: true, departmentId: true },
    });

    if (!targetUser) {
      return err("User not found.");
    }

    if (session.user.role === ROLES.ADMIN) {
      const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { departmentId: true },
      });

      if (!currentUser?.departmentId) {
        return err(
          "You do not have a department assigned. Contact a superadmin.",
        );
      }

      if (
        targetUser.role === ROLES.ADMIN ||
        targetUser.role === ROLES.SUPERADMIN
      ) {
        return err("You cannot delete admin or superadmin users.");
      }

      if (targetUser.departmentId !== currentUser.departmentId) {
        return err("You can only delete users in your department.");
      }
    }

    await prisma.user.delete({
      where: { id: data.id },
    });

    revalidatePath("/admin/users");

    return ok({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    console.error("[deleteUser]", message);
    return err(message);
  }
}

function fireInviteEmail(
  toEmail: string,
  workEmail: string,
  inviteUrl: string,
) {
  const username = workEmail.split("@")[0];
  const { html, text } = renderInviteEmail({ username, inviteUrl });
  sendEmail({
    to: toEmail,
    subject: `You're invited to join as ${workEmail}`,
    text,
    html,
  }).catch((e) => console.error("[Background Email] Failed:", e));
}
