type BadgeVariant = "destructive" | "secondary" | "default";

export interface ShareStatusBadge {
  label: string;
  variant: BadgeVariant;
}

interface ShareLike {
  revoked: boolean;
  expiresAt: string | null;
  maxViews: number | null;
  viewCount: number;
}

export function getShareStatusBadge(share: ShareLike): ShareStatusBadge {
  if (share.revoked) return { label: "revoked", variant: "destructive" };
  if (share.expiresAt && new Date(share.expiresAt) < new Date())
    return { label: "expired", variant: "secondary" };
  if (share.maxViews && share.viewCount >= share.maxViews)
    return { label: "limit reached", variant: "secondary" };
  return { label: "active", variant: "default" };
}
