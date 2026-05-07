"use client";

import { startOfDay, subDays } from "date-fns";
import { useMemo, useState } from "react";

export type DateRange = "7d" | "30d" | "90d" | "1y" | "all";
export type Granularity = "Daily" | "Weekly";

export interface DashboardFilters {
  dateRange: DateRange;

  industryId: string;
  clientId: string;
  granularity: Granularity;
  rangeStart: Date | null;
  filtersActive: boolean;
  setDateRange: (v: DateRange) => void;
  setIndustryId: (v: string) => void;
  setClientId: (v: string) => void;
  setGranularity: (v: Granularity) => void;
  resetFilters: () => void;
}

const DEFAULT_DATE_RANGE: DateRange = "30d";

function computeRangeStart(dateRange: DateRange): Date | null {
  if (dateRange === "all") return null;
  const days =
    dateRange === "7d"
      ? 7
      : dateRange === "30d"
        ? 30
        : dateRange === "90d"
          ? 90
          : 365;
  return startOfDay(subDays(new Date(), days));
}

export function useDashboardFilters(): DashboardFilters {
  const [dateRange, setDateRange] = useState<DateRange>(DEFAULT_DATE_RANGE);
  const [industryId, setIndustryId] = useState<string>("all");
  const [clientId, setClientId] = useState<string>("all");
  const [granularity, setGranularity] = useState<Granularity>("Daily");

  const rangeStart = useMemo(() => computeRangeStart(dateRange), [dateRange]);

  const filtersActive =
    dateRange !== DEFAULT_DATE_RANGE ||
    industryId !== "all" ||
    clientId !== "all";

  function resetFilters() {
    setDateRange(DEFAULT_DATE_RANGE);
    setIndustryId("all");
    setClientId("all");
  }

  return {
    dateRange,
    industryId,
    clientId,
    granularity,
    rangeStart,
    filtersActive,
    setDateRange,
    setIndustryId,
    setClientId,
    setGranularity,
    resetFilters,
  };
}
