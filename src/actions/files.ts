"use server";

import { type ActionResult, ok, runAction } from "@/lib/action-result";
import { requireRole } from "@/lib/auth.server";

export async function uploadFile(input: {
  bucket: "client-logos" | "case-study-media" | "case-study-attachments";
  filename: string;
  dataBase64: string;
  contentType: string;
}): Promise<ActionResult<{ url: string }>> {
  return runAction(async () => {
    await requireRole("employee");
    return ok({
      url: `https://storage.example.com/${input.bucket}/${input.filename}`,
    });
  });
}
