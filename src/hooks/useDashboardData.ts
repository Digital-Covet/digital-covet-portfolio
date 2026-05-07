"use client";

import { useEffect, useState } from "react";
import {
  type CaseStudyListItemWithDates,
  listCaseStudies,
  listTaxonomies,
} from "@/actions/content";
import {
  type DashboardViewStats,
  getDashboardViewStats,
  listShares,
  type ShareLinkItem,
} from "@/actions/share";
import type { Taxonomies } from "@/types/case-studies";

export interface DashboardData {
  studies: CaseStudyListItemWithDates[];
  shares: ShareLinkItem[];
  viewStats: DashboardViewStats;
  taxonomies: Taxonomies;
}

interface UseDashboardDataResult {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
}

const EMPTY_TAXONOMIES: Taxonomies = {
  industries: [],
  categories: [],
  services: [],
  sectors: [],
  keyBusinesses: [],
  clients: [],
};

const EMPTY_VIEW_STATS: DashboardViewStats = {
  viewCountByShareId: {},
  totalViews: 0,
  dailyBuckets: [],
};

export function useDashboardData(): UseDashboardDataResult {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      listCaseStudies(),
      listShares(),
      listTaxonomies(),
      getDashboardViewStats(),
    ])
      .then(([studiesResult, sharesResult, taxResult, viewStatsResult]) => {
        if (cancelled) return;

        if (!studiesResult.ok) {
          setError(studiesResult.error.message);
          return;
        }
        if (!sharesResult.ok) {
          setError(sharesResult.error.message);
          return;
        }
        if (!taxResult.ok) {
          setError(taxResult.error.message);
          return;
        }
        if (!viewStatsResult.ok) {
          setError(viewStatsResult.error.message);
          return;
        }

        setData({
          studies: studiesResult.data.studies,
          shares: sharesResult.data.shares,
          taxonomies: taxResult.data ?? EMPTY_TAXONOMIES,
          viewStats: viewStatsResult.data ?? EMPTY_VIEW_STATS,
        });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(
          e instanceof Error ? e.message : "Unexpected error loading dashboard",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}
