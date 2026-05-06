"use server";
import { headers } from "next/headers";
import { prisma } from "@/db";
import { auth } from "@/lib/auth";
import { buildInviteUrl, ROLES, WORK_EMAIL_DOMAIN } from "@/lib/constants";
import { err, ok, type Result } from "@/lib/result";
import { sendEmail } from "@/services/email";
import { renderInviteEmail } from "@/services/email-templates";
import { createUserAndInvite, resetInvitation } from "@/services/invitation";

interface InviteSuccessData {
  inviteUrl: string;
}

export async function testInviteEmployee(
  workEmail: string,
): Promise<Result<InviteSuccessData>> {
  if (process.env.NODE_ENV === "production") {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session?.user) {
      return err("Unauthorized.");
    }
  }

  if (!workEmail || !workEmail.endsWith(WORK_EMAIL_DOMAIN)) {
    return err(`A valid work email (${WORK_EMAIL_DOMAIN}) is required.`);
  }

  try {
    const [existingUser, invitation] = await Promise.all([
      prisma.user.findUnique({ where: { email: workEmail } }),
      prisma.invitation.findFirst({
        where: {
          email: workEmail,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
      }),
    ]);

    if (existingUser?.passwordChanged) {
      return err(
        "A user with this work email already exists and has activated their account.",
      );
    }

    if (existingUser && !existingUser.passwordChanged) {
      const result = await resetInvitation(
        workEmail,
        existingUser.id,
        existingUser.role || ROLES.EMPLOYEE,
      );
      fireInviteEmail(workEmail, workEmail, result.inviteUrl);
      return ok({ inviteUrl: result.inviteUrl });
    }

    if (invitation) {
      return err(
        "An invitation already exists for this work email. Use the resend function.",
      );
    }

    const result = await createUserAndInvite(workEmail, ROLES.EMPLOYEE);
    fireInviteEmail(workEmail, workEmail, result.inviteUrl);
    return ok({ inviteUrl: result.inviteUrl });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    console.error("[testInviteEmployee]", message);
    return err(message);
  }
}

export async function inviteEmployee(
  workEmail: string,
): Promise<Result<InviteSuccessData>> {
  if (!workEmail || !workEmail.endsWith(WORK_EMAIL_DOMAIN)) {
    return err(`A valid work email (${WORK_EMAIL_DOMAIN}) is required.`);
  }

  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (
      !session ||
      (session.user.role !== ROLES.ADMIN &&
        session.user.role !== ROLES.SUPERADMIN)
    ) {
      return err("Unauthorized. Admin access is required to invite employees.");
    }

    const [existingUser, invitation] = await Promise.all([
      prisma.user.findUnique({ where: { email: workEmail } }),
      prisma.invitation.findFirst({
        where: {
          email: workEmail,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
      }),
    ]);

    if (existingUser?.passwordChanged) {
      return err(
        "A user with this work email already exists and has activated their account.",
      );
    }

    if (existingUser && !existingUser.passwordChanged) {
      if (invitation) {
        return err(
          "An invitation already exists for this user. Use the resend function.",
        );
      }
      const result = await resetInvitation(
        workEmail,
        existingUser.id,
        ROLES.EMPLOYEE,
        session.user.id,
      );
      fireInviteEmail(workEmail, workEmail, result.inviteUrl);
      return ok({ inviteUrl: result.inviteUrl });
    }

    if (invitation) {
      return err(
        "An invitation already exists for this work email. Use the resend function.",
      );
    }

    const result = await createUserAndInvite(
      workEmail,
      ROLES.EMPLOYEE,
      session.user.id,
    );
    fireInviteEmail(workEmail, workEmail, result.inviteUrl);
    return ok({ inviteUrl: result.inviteUrl });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    console.error("[inviteEmployee]", message);
    return err(message);
  }
}

export async function getExistingInviteUrl(
  email: string,
): Promise<Result<{ inviteUrl: string }>> {
  // 👇 Add this same development bypass here
  if (process.env.NODE_ENV === "production") {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session?.user) {
      return err("Unauthorized.");
    }
  }

  if (!email) {
    return err("Email is required.");
  }

  try {
    const invitation = await prisma.invitation.findFirst({
      where: { email, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });

    if (!invitation) {
      return err("No active invitation found for this email.");
    }

    return ok({ inviteUrl: buildInviteUrl(invitation.token) });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    console.error("[getExistingInviteUrl]", message);
    return err(message);
  }
}

export async function sendInviteEmail(data: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<Result<{ success: boolean }>> {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });
  if (
    !session?.user ||
    (session.user.role !== ROLES.ADMIN &&
      session.user.role !== ROLES.SUPERADMIN)
  ) {
    return err("Unauthorized.");
  }

  try {
    await sendEmail(data);
    return ok({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send email.";
    console.error("[sendInviteEmail]", message);
    return err(message);
  }
}

export async function resendInvite(
  workEmail: string,
): Promise<Result<InviteSuccessData>> {
  if (!workEmail || !workEmail.endsWith(WORK_EMAIL_DOMAIN)) {
    return err(`A valid work email (${WORK_EMAIL_DOMAIN}) is required.`);
  }

  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (
      !session ||
      (session.user.role !== ROLES.ADMIN &&
        session.user.role !== ROLES.SUPERADMIN)
    ) {
      return err("Unauthorized. Admin access is required to resend invites.");
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: workEmail },
    });
    if (!existingUser) {
      return err("No user found with this work email.");
    }
    if (existingUser.passwordChanged) {
      return err("This user has already activated their account.");
    }

    const result = await resetInvitation(
      workEmail,
      existingUser.id,
      existingUser.role || ROLES.EMPLOYEE,
      session.user.id,
    );
    fireInviteEmail(workEmail, workEmail, result.inviteUrl);

    return ok({ inviteUrl: result.inviteUrl });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    console.error("[resendInvite]", message);
    return err(message);
  }
}

export async function setupPassword(
  token: string,
  newPassword: string,
): Promise<Result<{ success: boolean }>> {
  if (!token || !newPassword || newPassword.length < 8) {
    return err(
      "A valid token and new password (min 8 characters) are required.",
    );
  }

  try {
    const invitation = await prisma.invitation.findUnique({ where: { token } });
    if (!invitation)
      return err("The invitation token is invalid or does not exist.");
    if (invitation.expiresAt.getTime() < Date.now())
      return err("This invitation has expired.");
    if (invitation.usedAt) return err("This invitation has already been used.");

    const user = await prisma.user.findUnique({
      where: { email: invitation.email },
    });
    if (!user) return err("No account found for this invitation.");
    if (user.passwordChanged)
      return err(
        "This account has already been activated. Please log in normally.",
      );

    // Hash and update password directly
    const ctx = await auth.$context;
    const hash = await ctx.password.hash(newPassword);

    // Check if credential exists, create if not, update if exists
    const accounts = await ctx.internalAdapter.findAccounts(user.id);
    const hasCredential = accounts.some((ac) => ac.providerId === "credential");

    if (!hasCredential) {
      await ctx.internalAdapter.createAccount({
        userId: user.id,
        providerId: "credential",
        password: hash,
        accountId: user.id,
      });
    } else {
      await ctx.internalAdapter.updatePassword(user.id, hash);
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordChanged: true, emailVerified: true },
      }),
      prisma.invitation.update({
        where: { token },
        data: { usedAt: new Date() },
      }),
    ]);

    return ok({ success: true });
  } catch (error: any) {
    console.error("[setupPassword]", error);
    return err(
      error?.message || "An error occurred while setting your password.",
    );
  }
}

// --- Helper: Fire and forget email ---
function fireInviteEmail(
  toEmail: string,
  workEmail: string,
  inviteUrl: string,
) {
  const username = workEmail.split("@")[0];
  const { html, text } = renderInviteEmail({ username, inviteUrl });

  sendEmail({
    to: toEmail,
    subject: `You're invited to join Digital Covet as ${workEmail}`,
    text,
    html,
  }).catch((e) => console.error("[Background Email] Failed:", e));
}
