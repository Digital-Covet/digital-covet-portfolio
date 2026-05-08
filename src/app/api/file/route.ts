import { Readable } from "node:stream";
import { GetObjectCommand, S3ServiceException } from "@aws-sdk/client-s3";
import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth.server";
import { R2_BUCKET_NAME, r2Client } from "@/lib/r2";

export async function GET(request: NextRequest) {
  // ── Authentication ──
  try {
    await requireRole("employee");
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  // ── Extract and decode the S3 key ──
  const rawKey = request.nextUrl.searchParams.get("key");
  if (!rawKey) {
    return new Response("Missing key parameter", { status: 400 });
  }

  const key = decodeURIComponent(rawKey);

  // ── Fetch from R2 ──
  try {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    const response = await r2Client.send(command);

    if (!response.Body) {
      return new Response("File not found", { status: 404 });
    }

    // Convert Node.js Readable → Web ReadableStream for the Response body
    const bodyStream = Readable.toWeb(
      response.Body as Readable,
    ) as ReadableStream;

    // ── Stream the file back with correct Content-Type ──
    return new Response(bodyStream, {
      status: 200,
      headers: {
        "Content-Type": response.ContentType ?? "application/octet-stream",
        ...(response.ContentLength
          ? { "Content-Length": String(response.ContentLength) }
          : {}),
        "Cache-Control": "private, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error: unknown) {
    // Handle missing keys gracefully
    if (
      error instanceof S3ServiceException &&
      (error.name === "NoSuchKey" || error.$metadata?.httpStatusCode === 404)
    ) {
      return new Response("File not found", { status: 404 });
    }

    console.error("R2 GetObject error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
