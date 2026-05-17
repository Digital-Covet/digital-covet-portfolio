import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { parseR2Key } from "./r2-authorization";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

if (
  !R2_ACCOUNT_ID ||
  !R2_ACCESS_KEY_ID ||
  !R2_SECRET_ACCESS_KEY ||
  !R2_BUCKET_NAME
) {
  throw new Error("Missing required R2 environment variables");
}

const VERIFIED_R2_BUCKET_NAME: string = R2_BUCKET_NAME;

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export { VERIFIED_R2_BUCKET_NAME as R2_BUCKET_NAME };

export function extractR2KeyFromProxyUrl(proxyUrl: string): string | null {
  try {
    const url = proxyUrl.startsWith("http")
      ? new URL(proxyUrl)
      : new URL(proxyUrl, "http://placeholder.local");
    const key = url.searchParams.get("key");
    if (!key || key.trim() === "") return null;
    if (!parseR2Key(key)) return null;
    return key;
  } catch (error) {
    console.error("[R2] Failed to parse proxy URL:", proxyUrl, error);
    return null;
  }
}

export async function deleteR2File(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: VERIFIED_R2_BUCKET_NAME,
    Key: key,
  });
  await r2Client.send(command);
}
