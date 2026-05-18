import { GetObjectCommand, S3ServiceException } from "@aws-sdk/client-s3";
import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth.server";
import { R2_BUCKET_NAME, r2Client } from "@/lib/r2";
import { authorizeR2Access, parseR2Key } from "@/lib/r2-authorization";

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  let user;
  try {
    user = await requireRole("employee");
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  const key = request.nextUrl.searchParams.get("key");
  if (!key) {
    return new Response("Missing key parameter", { status: 400 });
  }

  const metadata = parseR2Key(key);
  if (!metadata) {
    return new Response("Invalid key format", { status: 400 });
  }

  const authResult = await authorizeR2Access(user, key);
  if (!authResult.authorized) {
    console.warn("[SECURITY] Unauthorized file access", {
      userId: user.id,
      bucket: metadata.bucket,
      dept: metadata.dept,
      ownerUserId: metadata.userId,
      caseStudyId: metadata.caseStudyId,
    });
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

    // FIX: AWS SDK v3 Body is a web ReadableStream (SdkStreamMixin), NOT a
    // Node.js Readable. Do NOT cast to Readable and pipe through the node
    // stream adapter — its .on() listeners never fire on a web stream,
    // producing an empty/hung response body on every page load after upload.
    //
    // Instead, use .transformToWebStream() which the SDK exposes on Body,
    // giving us a proper ReadableStream<Uint8Array> for the Response.
    const webStream = r2Response.Body.transformToWebStream();

    return new Response(webStream, {
      status: 200,
      headers: {
        "Content-Type": r2Response.ContentType ?? "application/octet-stream",
        ...(r2Response.ContentLength
          ? { "Content-Length": String(r2Response.ContentLength) }
          : {}),
        "Cache-Control": "private, max-age=3600, stale-while-revalidate=86400",
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
