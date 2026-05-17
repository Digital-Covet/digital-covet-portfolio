import type { UploadBucket } from "@/lib/upload-validation";
import type { AuthUser } from "@/types/auth.types";

const R2_KEY_PATTERN =
  /^(?<bucket>client-logos|case-study-media|case-study-attachments)\/dept=(?<dept>[^/]+)\/user=(?<userId>[^/]+)(?:\/case-study=(?<caseStudyId>[^/]+))?\/year=(?<year>\d{4})\/month=(?<month>\d{2})\/(?<objectId>[A-Za-z0-9-]{36})_(?<filename>[^/]+)$/;

export type R2KeyMetadata = {
  bucket: UploadBucket;
  dept: string;
  userId: string;
  caseStudyId: string | null;
  year: string;
  month: string;
  objectId: string;
  filename: string;
};

export function parseR2Key(key: string): R2KeyMetadata | null {
  const match = R2_KEY_PATTERN.exec(key);
  if (!match?.groups) return null;

  return {
    bucket: match.groups.bucket as UploadBucket,
    dept: match.groups.dept,
    userId: match.groups.userId,
    caseStudyId: match.groups.caseStudyId ?? null,
    year: match.groups.year,
    month: match.groups.month,
    objectId: match.groups.objectId,
    filename: match.groups.filename,
  };
}

export async function authorizeR2Access(
  user: Pick<AuthUser, "id" | "departmentId" | "role">,
  key: string,
): Promise<{ authorized: boolean; reason?: string }> {
  if (user.role === "admin") {
    return { authorized: true };
  }

  const metadata = parseR2Key(key);
  if (!metadata) {
    return { authorized: false, reason: "Invalid key format" };
  }

  if (metadata.userId === user.id) {
    return { authorized: true };
  }

  if (user.departmentId && metadata.dept === user.departmentId) {
    return { authorized: true };
  }

  if (metadata.dept === "unassigned") {
    return { authorized: true };
  }

  return {
    authorized: false,
    reason: `Access denied for bucket=${metadata.bucket}, dept=${metadata.dept}`,
  };
}
