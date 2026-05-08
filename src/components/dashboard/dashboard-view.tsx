"use client";

import {
  ArrowRightIcon,
  BriefcaseIcon,
  EyeIcon,
  FileTextIcon,
  PencilLineIcon,
  PlusIcon,
  PulseIcon,
  ShareIcon,
  XIcon,
} from "@phosphor-icons/react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useMemo } from "react";
import { ExportButton } from "@/components/dashboard/ExportButton";
import { ViewsChart } from "@/components/dashboard/ViewsChart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useDashboardDerivedData } from "@/hooks/useDashboardDerivedData";
import { useDashboardFilters } from "@/hooks/useDashboardFilters";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { ActivityItem } from "@/utils/buildActivityFeed";
import { getShareStatus } from "@/utils/shareStatus";

export function DashboardView() {
  const { data, loading, error } = useDashboardData();

  const filters = useDashboardFilters();

  const derived = useDashboardDerivedData({
    studies: data?.studies ?? [],
    shares: data?.shares ?? [],
    viewStats: data?.viewStats ?? {
      viewCountByShareId: {},
      totalViews: 0,
      dailyBuckets: [],
    },
    industryId: filters.industryId,
    clientId: filters.clientId,
    rangeStart: filters.rangeStart,
    granularity: filters.granularity,
  });

  const themeColors = useThemeColors(false);

  const maxIndustryCount = useMemo(
    () => Math.max(1, ...derived.keyBusinessBreakdown.map(([, c]) => c)),
    [derived.keyBusinessBreakdown],
  );

  const taxonomies = data?.taxonomies ?? {
    industries: [],
    categories: [],
    services: [],
    sectors: [],
    keyBusinesses: [],
    clients: [],
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl p-6 md:p-10">
        <div className="text-sm text-muted-foreground">Loading dashboard…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl p-6 md:p-10">
        <Card>
          <CardContent className="p-6 text-sm text-destructive">
            Failed to load dashboard: {error}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-6 md:p-10">
      {}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All your work at a glance — case studies, clients, and shared
            portfolios.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {}
          <ExportButton
            filteredStudies={derived.filteredStudies}
            filteredShares={derived.filteredShares}
            viewCountByShareId={derived.viewCountByShareId}
            stats={derived.stats}
            taxonomies={taxonomies}
            dateRange={filters.dateRange}
            industryId={filters.industryId}
            clientId={filters.clientId}
          />
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={
              <Link href="/shares/new">
                <ShareIcon size={16} className="mr-2" /> New share
              </Link>
            }
          />
          <Button
            size="sm"
            nativeButton={false}
            render={
              <Link href="/case-studies/new">
                <PlusIcon size={16} className="mr-2" /> New case study
              </Link>
            }
          />
        </div>
      </div>

      {}
      <Card className="mt-6">
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="flex flex-col gap-1">
            <Label
              htmlFor="date-range"
              className="text-xs font-medium text-muted-foreground"
            >
              Date range
            </Label>
            <Select
              value={filters.dateRange}
              onValueChange={(v) =>
                filters.setDateRange(v as typeof filters.dateRange)
              }
            >
              <SelectTrigger id="date-range" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label
              htmlFor="industry"
              className="text-xs font-medium text-muted-foreground"
            >
              Industry
            </Label>
            {}
            <Select
              value={filters.industryId}
              onValueChange={(v) => filters.setIndustryId(v ?? "all")}
            >
              <SelectTrigger id="industry" className="w-45">
                <SelectValue placeholder="Select industry">
                  {filters.industryId === "all"
                    ? "All industries"
                    : taxonomies.industries.find(
                        (i) => i.id === filters.industryId,
                      )?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All industries</SelectItem>
                {taxonomies.industries.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label
              htmlFor="client"
              className="text-xs font-medium text-muted-foreground"
            >
              Client
            </Label>
            <Select
              value={filters.clientId}
              onValueChange={(v) => filters.setClientId(v ?? "all")}
            >
              <SelectTrigger id="client" className="w-45">
                <SelectValue placeholder="Select client">
                  {filters.clientId === "all"
                    ? "All clients"
                    : taxonomies.clients.find((c) => c.id === filters.clientId)
                        ?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All clients</SelectItem>
                {taxonomies.clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filters.filtersActive && (
            <Button variant="ghost" size="sm" onClick={filters.resetFilters}>
              <XIcon size={16} className="mr-1" /> Reset
            </Button>
          )}
        </CardContent>
      </Card>

      {}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<FileTextIcon size={16} />}
          label="Case studies"
          value={derived.filteredStudies.length}
          sub={`${derived.stats.published} published · ${derived.stats.drafts} drafts`}
        />
        <StatCard
          icon={<BriefcaseIcon size={16} />}
          label="Clients"
          value={taxonomies.clients.length}
          sub={`${taxonomies.industries.length} industries`}
        />
        <StatCard
          icon={<ShareIcon size={16} />}
          label="Active shares"
          value={derived.stats.activeShares}
          sub={`${derived.filteredShares.length} total · ${derived.stats.expiredShares} expired`}
        />
        <StatCard
          icon={<EyeIcon size={16} />}
          label="Views in range"
          value={derived.stats.totalViews}
          sub="From share links"
        />
      </div>

      {}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <div className="text-base font-semibold">Share views over time</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {derived.chartBuckets.reduce((sum, d) => sum + d.views, 0)} views
              across the selected range
            </p>
          </div>
          <Select
            value={filters.granularity}
            onValueChange={(v) =>
              filters.setGranularity(v as typeof filters.granularity)
            }
          >
            <SelectTrigger className="w-30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Daily">Daily</SelectItem>
              <SelectItem value="Weekly">Weekly</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <ViewsChart buckets={derived.chartBuckets} colors={themeColors} />
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PulseIcon size={16} /> Recent activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {derived.activityFeed.map((item) => (
              <ActivityRow key={item.id} item={item} />
            ))}
            {derived.activityFeed.length === 0 && (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                No recent activity in this range.
              </div>
            )}
          </CardContent>
        </Card>

        {}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Work by industry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {derived.keyBusinessBreakdown.map(([name, count]) => (
              <div key={name}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="truncate font-medium">{name}</span>
                  <span className="text-muted-foreground">{count}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width: `${(count / maxIndustryCount) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            {derived.keyBusinessBreakdown.length === 0 && (
              <div className="text-sm text-muted-foreground">
                No data in range.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Top clients</CardTitle>
            <Link
              href="/clients"
              className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground"
            >
              View all <ArrowRightIcon size={16} className="ml-1" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {derived.clientBreakdown.map((c) => (
              <div
                key={c.name}
                className="flex items-center gap-3 rounded-md p-2 hover:bg-muted"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
                  <BriefcaseIcon size={16} className="text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1 truncate text-sm font-medium">
                  {c.name}
                </div>
                <Badge variant="secondary">
                  {c.count} {c.count === 1 ? "study" : "studies"}
                </Badge>
              </div>
            ))}
            {derived.clientBreakdown.length === 0 && (
              <div className="text-sm text-muted-foreground">
                No client work in range.
              </div>
            )}
          </CardContent>
        </Card>

        {}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Most viewed shares</CardTitle>
            <Link
              href="/shares"
              className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground"
            >
              View all <ArrowRightIcon size={16} className="ml-1" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-1">
            {derived.topShares.map((s) => {
              const status = getShareStatus(s);
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-3 rounded-md p-2 hover:bg-muted"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{s.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {s.recipientName ?? s.recipientEmail ?? "No recipient"}
                      {s.maxViews ? ` · limit ${s.maxViews}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Badge
                      variant={
                        status === "active"
                          ? "default"
                          : status === "expired"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {status}
                    </Badge>
                    <span className="inline-flex items-center text-muted-foreground">
                      <EyeIcon size={16} className="mr-1" />
                      {s._filteredViews}
                    </span>
                  </div>
                </div>
              );
            })}
            {derived.topShares.length === 0 && (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                No shares in this range.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span className="text-xs uppercase tracking-wide">{label}</span>
        </div>
        <div className="mt-3 text-3xl font-bold">{value}</div>
        {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  return (
    <Link
      href={item.href}
      className="flex items-start gap-3 rounded-md p-2 transition-colors hover:bg-muted"
    >
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          item.type === "case_study"
            ? "bg-primary/10 text-primary"
            : "bg-secondary text-secondary-foreground"
        }`}
      >
        {item.type === "case_study" ? (
          item.action === "created" ? (
            <PlusIcon size={16} />
          ) : (
            <PencilLineIcon size={16} />
          )
        ) : (
          <ShareIcon size={16} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm">
          <span className="font-medium">{item.title}</span>
          <span className="text-muted-foreground">
            {" "}
            — {item.type === "case_study" ? "case study" : "share link"}{" "}
            {item.action}
          </span>
        </div>
        {item.subtitle && (
          <div className="truncate text-xs text-muted-foreground">
            {item.subtitle}
          </div>
        )}
      </div>
      <div className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
        {formatDistanceToNow(item.at, { addSuffix: true })}
      </div>
    </Link>
  );
}
