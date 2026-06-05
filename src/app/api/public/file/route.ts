import { GetObjectCommand, S3ServiceException } from "@aws-sdk/client-s3";
import type { NextRequest } from "next/server";
import { R2_BUCKET_NAME, r2Client } from "@/lib/r2";
import { parseR2Key } from "@/lib/r2-authorization";

export const maxDuration = 300;

const PUBLIC_BUCKETS = ["case-study-media", "case-study-attachments"] as const;

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  if (!key) {
    return new Response("Missing key parameter", { status: 400 });
  }

  const metadata = parseR2Key(key);
  if (!metadata) {
    return new Response("Invalid key format", { status: 400 });
  }

  if (
    !("bucket" in metadata) ||
    !PUBLIC_BUCKETS.includes(metadata.bucket as (typeof PUBLIC_BUCKETS)[number])
  ) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    const r2Response = await r2Client.send(command);

    if (!r2Response.Body) {
      return new Response("File not found", { status: 404 });
    }

    const webStream = r2Response.Body.transformToWebStream();

    return new Response(webStream, {
      status: 200,
      headers: {
        "Content-Type": r2Response.ContentType ?? "application/octet-stream",
        ...(r2Response.ContentLength
          ? { "Content-Length": String(r2Response.ContentLength) }
          : {}),
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "X-Content-Type-Options": "nosniff",
        ...(metadata.bucket === "case-study-attachments"
          ? {
              "Content-Disposition": `attachment; filename="${metadata.filename}"`,
            }
          : {}),
      },
    });
  } catch (error: unknown) {
    if (
      error instanceof S3ServiceException &&
      (error.name === "NoSuchKey" || error.$metadata?.httpStatusCode === 404)
    ) {
      return new Response("File not found", { status: 404 });
    }
    console.error("[R2] GetObject error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
