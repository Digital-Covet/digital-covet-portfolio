export type ShareStatus = "active" | "expired" | "revoked";

export function getShareStatus(share: {
  revoked: boolean;
  expiresAt: Date | null;
}): ShareStatus {
  if (share.revoked) return "revoked";
  if (share.expiresAt && new Date(share.expiresAt) <= new Date())
    return "expired";
  return "active";
}
