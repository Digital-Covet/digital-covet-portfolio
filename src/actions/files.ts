"use server";

import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { type ActionResult, ok, runAction } from "@/lib/action-result";
import { requireRole } from "@/lib/auth.server";
import { R2_BUCKET_NAME, r2Client } from "@/lib/r2";

export async function getUploadPresignedUrl(input: {
  bucket: "client-logos" | "case-study-media" | "case-study-attachments";
  filename: string;
  contentType: string;
}): Promise<ActionResult<{ presignedUrl: string; proxyUrl: string }>> {
  return runAction(async () => {
    const user = await requireRole("employee");

    // ── Hive-partitioned key construction ──
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const dept = user.departmentId || "unassigned";

    // Sanitize filename to prevent path-separator injection
    const safeFilename = input.filename.replace(/[\\/]/g, "_");

    const key = `${input.bucket}/dept=${dept}/user=${user.id}/year=${year}/month=${month}/${randomUUID()}_${safeFilename}`;

    // ── Generate pre-signed PUT URL ──
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: input.contentType,
    });

    const presignedUrl = await getSignedUrl(r2Client, command, {
      expiresIn: 300, // 5 minutes
    });

    // ── Return internal proxy URL (never a public R2 URL) ──
    const proxyUrl = `/api/file?key=${encodeURIComponent(key)}`;

    return ok({ presignedUrl, proxyUrl });
  });
}
