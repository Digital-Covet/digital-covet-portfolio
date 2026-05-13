"use server";

import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/db";
import { type ActionResult, ok, runAction } from "@/lib/action-result";
import { auth } from "@/lib/auth";
import { requireUser } from "@/lib/auth.server";
import { R2_BUCKET_NAME, r2Client } from "@/lib/r2";

const avatarUploadInputSchema = z.object({
  contentType: z
    .string()
    .trim()
    .regex(/^image\/[a-z0-9.+-]+$/i, "Please select a valid image file."),
});

const backupCodeInputSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Enter your backup code.")
    .transform((value) => value.replace(/\s+/g, "")),
});

export async function createAvatarUploadUrl(input: {
  contentType: string;
}): Promise<ActionResult<{ presignedUrl: string; proxyUrl: string }>> {
  return runAction(async () => {
    const user = await requireUser();
    const parsed = avatarUploadInputSchema.parse(input);

    const key = `avatars/user=${user.id}/${randomUUID()}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: parsed.contentType,
    });

    const presignedUrl = await getSignedUrl(r2Client, command, {
      expiresIn: 300,
    });

    return ok({
      presignedUrl,
      proxyUrl: `/api/file?key=${encodeURIComponent(key)}`,
    });
  });
}

export async function disable2FAWithBackupCode(input: {
  code: string;
}): Promise<ActionResult<{ success: true }>> {
  return runAction(async () => {
    const user = await requireUser();
    const parsed = backupCodeInputSchema.parse(input);

    await auth.api.verifyBackupCode({
      body: {
        code: parsed.code,
        disableSession: true,
        trustDevice: false,
      },
      headers: await headers(),
    });

    await prisma.$transaction([
      prisma.twoFactor.deleteMany({
        where: { userId: user.id },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { twoFactorEnabled: false },
      }),
    ]);

    return ok({ success: true });
  });
}
const updateNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters"),
});
export async function updateAccountName(input: {
  name: string;
}): Promise<ActionResult<{ success: true }>> {
  return runAction(async () => {
    const user = await requireUser();

    const parsed = updateNameSchema.parse(input);

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        name: parsed.name,
      },
    });

    return ok({ success: true });
  });
}
