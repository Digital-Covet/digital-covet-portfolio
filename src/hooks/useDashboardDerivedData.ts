"use client";

import {
  eachDayOfInterval,
  eachWeekOfInterval,
  format,
  startOfDay,
  subDays,
} from "date-fns";
import { useMemo } from "react";
import type { DashboardViewStats, ShareLinkItem } from "@/actions/share";
import type { CaseStudyListItemWithDates } from "@/types/case-studies";
import {
  type ActivityItem,
  buildActivityFeed,
} from "@/utils/buildActivityFeed";
import type { Granularity } from "./useDashboardFilters";

export interface ChartBucket {
  date: string;
  label: string;
  views: number;
}

export interface ShareWithViewCount extends ShareLinkItem {
  _filteredViews: number;
}

export interface DashboardStats {
  published: number;
  drafts: number;
  totalViews: number;
  activeShares: number;
  expiredShares: number;
}

export interface DerivedDashboardData {
  filteredStudies: CaseStudyListItemWithDates[];
  filteredShares: ShareLinkItem[];

  viewCountByShareId: Map<string, number>;
  stats: DashboardStats;
  keyBusinessBreakdown: [string, number][];
  clientBreakdown: { name: string; count: number }[];
  topShares: ShareWithViewCount[];
  chartBuckets: ChartBucket[];
  activityFeed: ActivityItem[];
}

interface Props {
  studies: CaseStudyListItemWithDates[];
  shares: ShareLinkItem[];
  viewStats: DashboardViewStats;
  industryId: string;
  clientId: string;
  rangeStart: Date | null;
  granularity: Granularity;
}

export function useDashboardDerivedData({
  studies,
  shares,
  viewStats,
  industryId,
  clientId,
  rangeStart,
  granularity,
}: Props): DerivedDashboardData {
  const filteredStudies = useMemo(() => {
    return studies.filter((study) => {
      if (
        industryId !== "all" &&
        !study.keyBusinesses.some((k) => k.industryId === industryId)
      )
        return false;
      if (clientId !== "all" && study.clientId !== clientId) return false;
      if (rangeStart) {
        const ref = study.updatedAt ?? study.createdAt;
        if (ref < rangeStart) return false;
      }
      return true;
    });
  }, [studies, industryId, clientId, rangeStart]);

  const filteredShares = useMemo(() => {
    return shares.filter((s) => {
      if (rangeStart && s.createdAt < rangeStart) return false;
      if (industryId !== "all") {
        const arr: string[] = s.filterIndustryIds ?? [];
        if (arr.length > 0 && !arr.includes(industryId)) return false;
      }
      if (clientId !== "all") {
        const arr: string[] = s.filterClientIds ?? [];
        if (arr.length > 0 && !arr.includes(clientId)) return false;
      }
      return true;
    });
  }, [shares, industryId, clientId, rangeStart]);

  const filteredShareIds = useMemo(
    () => new Set(filteredShares.map((s) => s.id)),
    [filteredShares],
  );

  const viewCountByShareId = useMemo(() => {
    const map = new Map<string, number>();
    for (const [shareId, count] of Object.entries(
      viewStats.viewCountByShareId,
    )) {
      if (filteredShareIds.has(shareId)) {
        map.set(shareId, count);
      }
    }
    return map;
  }, [viewStats.viewCountByShareId, filteredShareIds]);

  const stats = useMemo((): DashboardStats => {
    const published = filteredStudies.filter(
      (s) => s.status === "published",
    ).length;
    const drafts = filteredStudies.filter((s) => s.status === "draft").length;
    const totalViews = Array.from(viewCountByShareId.values()).reduce(
      (sum, c) => sum + c,
      0,
    );
    const now = new Date();
    const activeShares = filteredShares.filter(
      (s) => !s.revoked && (!s.expiresAt || new Date(s.expiresAt) > now),
    ).length;
    const expiredShares = filteredShares.filter(
      (s) => !s.revoked && s.expiresAt && new Date(s.expiresAt) <= now,
    ).length;
    return { published, drafts, totalViews, activeShares, expiredShares };
  }, [filteredStudies, filteredShares, viewCountByShareId]);

  const keyBusinessBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of filteredStudies) {
      for (const kb of s.keyBusinesses) {
        map.set(kb.name, (map.get(kb.name) ?? 0) + 1);
      }
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [filteredStudies]);

  const clientBreakdown = useMemo(() => {
    const map = new Map<string, { name: string; count: number }>();
    for (const s of filteredStudies) {
      const name = s.client?.name;
      if (!name) continue;
      const existing = map.get(name);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(name, { name, count: 1 });
      }
    }
    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredStudies]);

  const topShares = useMemo((): ShareWithViewCount[] => {
    return [...filteredShares]
      .map((s) => ({
        ...s,
        _filteredViews: viewCountByShareId.get(s.id) ?? 0,
      }))
      .sort((a, b) => b._filteredViews - a._filteredViews)
      .slice(0, 5);
  }, [filteredShares, viewCountByShareId]);

  const chartBuckets = useMemo((): ChartBucket[] => {
    const end = new Date();

    let start: Date;
    if (rangeStart !== null) {
      start = rangeStart;
    } else if (viewStats.dailyBuckets.length > 0) {
      start = startOfDay(new Date(viewStats.dailyBuckets[0]!.date));
    } else {
      start = subDays(end, 30);
    }

    const bucketDates =
      granularity === "Weekly"
        ? eachWeekOfInterval({ start, end }, { weekStartsOn: 1 })
        : eachDayOfInterval({ start, end });

    const serverCounts = new Map<string, number>();
    for (const b of viewStats.dailyBuckets) {
      serverCounts.set(b.date, b.views);
    }

    if (granularity === "Weekly") {
      return bucketDates.map((weekStart) => {
        const key = format(weekStart, "yyyy-MM-dd");

        let weekViews = 0;
        for (const [dateStr, count] of serverCounts.entries()) {
          const d = new Date(dateStr);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 7);
          if (d >= weekStart && d < weekEnd) {
            weekViews += count;
          }
        }
        return {
          date: key,
          label: format(weekStart, "MMM d"),
          views: weekViews,
        };
      });
    }

    return bucketDates.map((day) => {
      const key = format(startOfDay(day), "yyyy-MM-dd");
      return {
        date: key,
        label: format(day, "MMM d"),
        views: serverCounts.get(key) ?? 0,
      };
    });
  }, [viewStats.dailyBuckets, rangeStart, granularity]);

  const activityFeed = useMemo(
    () => buildActivityFeed(filteredStudies, filteredShares),
    [filteredStudies, filteredShares],
  );

  return {
    filteredStudies,
    filteredShares,
    viewCountByShareId,
    stats,
    keyBusinessBreakdown,
    clientBreakdown,
    topShares,
    chartBuckets,
    activityFeed,
  };
}
