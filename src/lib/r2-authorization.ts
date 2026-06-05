import type { AuthUser } from "@/types/auth.types";

const R2_KEY_PATTERN =
  /^(?<bucket>client-logos|case-study-media|case-study-attachments)\/dept=(?<dept>[^/]+)\/user=(?<userId>[^/]+)(?:\/case-study=(?<caseStudyId>[^/]+))?\/year=(?<year>\d{4})\/month=(?<month>\d{2})\/(?<objectId>[A-Za-z0-9-]{36})_(?<filename>[^/]+)$/;

const AVATAR_KEY_PATTERN =
  /^avatars\/user=(?<userId>[^/]+)\/(?<objectId>[A-Za-z0-9-]{36})$/;

export type R2KeyMetadata = {
  bucket: string;
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
  if (match?.groups) {
    return {
      bucket: match.groups.bucket,
      dept: match.groups.dept,
      userId: match.groups.userId,
      caseStudyId: match.groups.caseStudyId ?? null,
      year: match.groups.year,
      month: match.groups.month,
      objectId: match.groups.objectId,
      filename: match.groups.filename,
    };
  }

  const avatarMatch = AVATAR_KEY_PATTERN.exec(key);
  if (avatarMatch?.groups) {
    return {
      bucket: "avatars",
      dept: "",
      userId: avatarMatch.groups.userId,
      caseStudyId: null,
      year: "",
      month: "",
      objectId: avatarMatch.groups.objectId,
      filename: "",
    };
  }

  return null;
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
