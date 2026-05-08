import type { ShareLinkItem } from "@/actions/share";
import type { CaseStudyListItemWithDates } from "@/types/case-studies";

export interface ActivityItem {
  id: string;
  type: "case_study" | "share";
  action: "created" | "updated";
  title: string;
  subtitle?: string;
  at: Date;
  href: string;
}

export function buildActivityFeed(
  studies: CaseStudyListItemWithDates[],
  shares: ShareLinkItem[],
  limit = 12,
): ActivityItem[] {
  const items: ActivityItem[] = [];

  for (const s of studies) {
    const subtitle =
      s.client?.name ??
      (s.keyBusinesses.length > 0
        ? s.keyBusinesses.map((k) => k.name).join(", ")
        : undefined);

    items.push({
      id: `cs-create-${s.id}`,
      type: "case_study",
      action: "created",
      title: s.title,
      subtitle,
      at: s.createdAt,
      href: `/case-studies/${s.id}`,
    });

    if (
      s.updatedAt &&
      Math.abs(s.updatedAt.getTime() - s.createdAt.getTime()) > 1000
    ) {
      items.push({
        id: `cs-update-${s.id}`,
        type: "case_study",
        action: "updated",
        title: s.title,
        subtitle,
        at: s.updatedAt,
        href: `/case-studies/${s.id}`,
      });
    }
  }

  for (const sh of shares) {
    items.push({
      id: `sh-create-${sh.id}`,
      type: "share",
      action: "created",
      title: sh.name,
      subtitle: sh.recipientName ?? sh.recipientEmail ?? undefined,
      at: sh.createdAt,
      href: "/shares",
    });
  }

  return items.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);
}
