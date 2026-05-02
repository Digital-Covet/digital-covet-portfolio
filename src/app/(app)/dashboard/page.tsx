"use client";

import {
  ArrowRightIcon,
  BriefcaseIcon,
  DownloadSimpleIcon,
  EyeIcon,
  FilePdfIcon,
  FileTextIcon,
  FileXlsIcon,
  PencilLineIcon,
  PlusIcon,
  PulseIcon,
  ShareIcon,
  XIcon,
} from "@phosphor-icons/react";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import {
  eachDayOfInterval,
  eachWeekOfInterval,
  format,
  formatDistanceToNow,
  startOfDay,
  startOfWeek,
  subDays,
} from "date-fns";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

interface JsPDFDocument {
  lastAutoTable: { finalY: number };
}

import { listCaseStudies, listTaxonomies } from "@/actions/content";
import { listAllShareViews, listShares } from "@/actions/share";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler,
);

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CaseStudyData {
  id: string;
  title: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  industryId: string | null;
  clientId: string | null;
  client: { name: string; logoUrl: string | null } | null;
  industry: { name: string } | null;
}

interface ShareLinkData {
  id: string;
  name: string;
  createdAt: Date;
  revoked: boolean;
  expiresAt: Date | null;
  maxViews: number | null;
  recipientName: string | null;
  recipientEmail: string | null;
  filterIndustryIds: string[] | null;
  filterClientIds: string[] | null;
}

interface ShareViewData {
  id: string;
  shareLinkId: string;
  viewedAt: Date;
}

interface TaxonomyData {
  industries: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  services: { id: string; name: string }[];
  clients: { id: string; name: string }[];
}

interface ActivityItem {
  id: string;
  type: "case_study" | "share";
  action: "created" | "updated";
  title: string;
  subtitle?: string;
  at: Date;
  href: string;
}

type DateRange = "7d" | "30d" | "90d" | "1y" | "all";
type Granularity = "Daily" | "Weekly";

export default function Page() {
  const [studies, setStudies] = useState<CaseStudyData[]>([]);
  const [shares, setShares] = useState<ShareLinkData[]>([]);
  const [views, setViews] = useState<ShareViewData[]>([]);
  const [tax, setTax] = useState<TaxonomyData>({
    industries: [],
    categories: [],
    services: [],
    clients: [],
  });
  const [loading, setLoading] = useState(true);

  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [industryId, setIndustryId] = useState<string>("all");
  const [clientId, setClientId] = useState<string>("all");
  const [granularity, setGranularity] = useState<Granularity>("Daily");

  /* ---- chart theme (reactively resolve CSS variables) ---- */
  const [themeColors, setThemeColors] = useState({
    foreground: "#000",
    mutedForeground: "#888",
    primary: "#000",
    popover: "#fff",
    border: "#ccc",
  });

  useEffect(() => {
    const updateColors = () => {
      const root = document.documentElement;
      const style = getComputedStyle(root);

      const getHsl = (varName: string, fallback: string) => {
        const val = style.getPropertyValue(varName).trim();
        if (!val) return fallback;

        // Handle explicit hex/rgba overrides if present instead of HSL components
        if (
          val.startsWith("#") ||
          val.startsWith("rgb") ||
          val.startsWith("hsl")
        ) {
          return val;
        }

        // Convert shadcn space-separated HSL (e.g., "215 20% 65%") to standard CSS format
        if (val.includes(" ")) {
          const parts = val.split(/\s+/);
          if (parts.length >= 3) {
            return `hsl(${parts[0]}, ${parts[1]}, ${parts[2]})`;
          }
        }
        return `hsl(${val})`;
      };

      setThemeColors((prev) => {
        const next = {
          foreground: getHsl("--foreground", "#000"),
          mutedForeground: getHsl("--muted-foreground", "#888"),
          primary: getHsl("--primary", "#000"),
          popover: getHsl("--popover", "#fff"),
          border: getHsl("--border", "#ccc"),
        };

        // Bail out from setting state if the properties haven't changed to prevent unnecessary re-renders
        if (
          prev.foreground === next.foreground &&
          prev.mutedForeground === next.mutedForeground &&
          prev.primary === next.primary &&
          prev.popover === next.popover &&
          prev.border === next.border
        ) {
          return prev;
        }
        return next;
      });
    };

    updateColors();

    // Listen to theme changes automatically
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.attributeName === "class" ||
          mutation.attributeName === "style"
        ) {
          updateColors();
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    return () => observer.disconnect();
  }, []);

  const chartJsOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: "index" as const,
      },
      plugins: {
        legend: {
          display: true,
          position: "top" as const,
          labels: {
            font: { size: 12, family: "system-ui, sans-serif" },
            color: "#ffffff",
            usePointStyle: true,
            pointStyle: "line" as const,
          },
        },
        tooltip: {
          backgroundColor: themeColors.popover,
          titleColor: "#ffffff",
          bodyColor: "#ffffff",
          borderColor: themeColors.border,
          borderWidth: 1,
          padding: 10,
          cornerRadius: 8,
          titleFont: { size: 12 },
          bodyFont: { size: 12 },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: {
            font: { size: 11, family: "system-ui, sans-serif" },
            color: "#ffffff",
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 12,
          },
        },
        y: {
          grid: {
            color: themeColors.border,
            borderDash: [3, 3],
          },
          border: { display: false },
          beginAtZero: true,
          ticks: {
            font: { size: 11, family: "system-ui, sans-serif" },
            color: "#ffffff",
            precision: 0,
          },
        },
      },
    }),
    [themeColors],
  );

  /* ---- data fetching ---- */
  useEffect(() => {
    Promise.all([
      listCaseStudies(),
      listShares(),
      listTaxonomies(),
      listAllShareViews(),
    ])
      .then(([s, sh, t, v]) => {
        setStudies(s.studies as CaseStudyData[]);
        setShares(sh.shares as ShareLinkData[]);
        setTax(t as TaxonomyData);
        setViews(v.views as ShareViewData[]);
      })
      .finally(() => setLoading(false));
  }, []);

  /* ---- derived values ---- */
  const rangeStart = useMemo(() => {
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
  }, [dateRange]);

  const filteredStudies = useMemo(() => {
    return studies.filter((study) => {
      if (industryId !== "all" && study.industryId !== industryId) return false;
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
        if (arr.length && !arr.includes(industryId)) return false;
      }
      if (clientId !== "all") {
        const arr: string[] = s.filterClientIds ?? [];
        if (arr.length && !arr.includes(clientId)) return false;
      }
      return true;
    });
  }, [shares, industryId, clientId, rangeStart]);

  const filteredShareIds = useMemo(
    () => new Set(filteredShares.map((s) => s.id)),
    [filteredShares],
  );

  const filteredViews = useMemo(() => {
    return views.filter((v) => {
      if (!filteredShareIds.has(v.shareLinkId)) return false;
      if (rangeStart && v.viewedAt < rangeStart) return false;
      return true;
    });
  }, [views, filteredShareIds, rangeStart]);

  /* ---- stats ---- */
  const stats = useMemo(() => {
    const published = filteredStudies.filter(
      (s) => s.status === "published",
    ).length;
    const drafts = filteredStudies.filter((s) => s.status === "draft").length;
    const totalViews = filteredViews.length;
    const now = new Date();
    const activeShares = filteredShares.filter(
      (s) => !s.revoked && (!s.expiresAt || new Date(s.expiresAt) > now),
    ).length;
    const expiredShares = filteredShares.filter(
      (s) => !s.revoked && s.expiresAt && new Date(s.expiresAt) <= now,
    ).length;
    return { published, drafts, totalViews, activeShares, expiredShares };
  }, [filteredStudies, filteredShares, filteredViews]);

  /* ---- breakdowns ---- */
  const industryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of filteredStudies) {
      const name = s.industry?.name ?? "Uncategorized";
      map.set(name, (map.get(name) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [filteredStudies]);

  const clientBreakdown = useMemo(() => {
    const map = new Map<
      string,
      { name: string; logo: string | null; count: number }
    >();
    for (const s of filteredStudies) {
      const name = s.client?.name;
      if (!name) continue;
      const existing = map.get(name);
      if (existing) existing.count += 1;
      else
        map.set(name, {
          name,
          logo: s.client?.logoUrl ?? null,
          count: 1,
        });
    }
    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredStudies]);

  const topShares = useMemo(() => {
    const viewsByShare = new Map<string, number>();
    for (const v of filteredViews) {
      viewsByShare.set(
        v.shareLinkId,
        (viewsByShare.get(v.shareLinkId) ?? 0) + 1,
      );
    }
    return [...filteredShares]
      .map((s) => ({ ...s, _filteredViews: viewsByShare.get(s.id) ?? 0 }))
      .sort((a, b) => b._filteredViews - a._filteredViews)
      .slice(0, 5);
  }, [filteredShares, filteredViews]);

  /* ---- chart data ---- */
  const chartData = useMemo(() => {
    const end = new Date();
    const start = rangeStart ?? subDays(end, 30);
    const buckets =
      granularity === "Weekly"
        ? eachWeekOfInterval({ start, end }, { weekStartsOn: 1 })
        : eachDayOfInterval({ start, end });

    const counts = new Map<string, number>();
    for (const v of filteredViews) {
      const d = v.viewedAt;
      const key =
        granularity === "Weekly"
          ? format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd")
          : format(startOfDay(d), "yyyy-MM-dd");
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return buckets.map((b) => {
      const key = format(b, "yyyy-MM-dd");
      return {
        date: key,
        label: format(b, "MMM d"),
        views: counts.get(key) ?? 0,
      };
    });
  }, [filteredViews, rangeStart, granularity]);

  const chartJsData = useMemo(
    () => ({
      labels: chartData.map((d) => d.label),
      datasets: [
        {
          label: "Views",
          data: chartData.map((d) => d.views),
          borderColor: themeColors.primary,
          backgroundColor: "transparent",
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.4,
          fill: false,
        },
      ],
    }),
    [chartData, themeColors],
  );

  /* ---- chart instance with canvas ref ---- */
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Destroy previous chart instance if it exists to strictly prevent redraw overlaps
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    chartInstanceRef.current = new ChartJS(ctx, {
      type: "line",
      data: chartJsData,
      options: chartJsOptions,
    });

    // Cleanup on unmount
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [chartJsData, chartJsOptions]);

  /* ---- activity feed ---- */
  const activityFeed = useMemo(() => {
    const items: ActivityItem[] = [];

    for (const s of filteredStudies) {
      items.push({
        id: `cs-create-${s.id}`,
        type: "case_study",
        action: "created",
        title: s.title,
        subtitle: s.client?.name ?? s.industry?.name ?? undefined,
        at: s.createdAt,
        href: `/case-studies/${s.id}`,
      });
      if (s.updatedAt && s.updatedAt.getTime() !== s.createdAt.getTime()) {
        items.push({
          id: `cs-update-${s.id}`,
          type: "case_study",
          action: "updated",
          title: s.title,
          subtitle: s.client?.name ?? s.industry?.name ?? undefined,
          at: s.updatedAt,
          href: `/case-studies/${s.id}`,
        });
      }
    }
    for (const sh of filteredShares) {
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

    return items.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, 12);
  }, [filteredStudies, filteredShares]);

  const maxIndustryCount = Math.max(1, ...industryBreakdown.map(([, c]) => c));

  /* ---- exports ---- */
  const exportCSV = () => {
    const rows: string[][] = [];
    rows.push([
      "Section",
      "Type",
      "Name",
      "Client",
      "Industry",
      "Status",
      "Views",
      "Created",
      "Updated",
    ]);
    for (const s of filteredStudies) {
      rows.push([
        "Case Study",
        "case_study",
        s.title,
        s.client?.name ?? "",
        s.industry?.name ?? "",
        s.status,
        "",
        format(s.createdAt, "yyyy-MM-dd HH:mm:ss"),
        format(s.updatedAt, "yyyy-MM-dd HH:mm:ss"),
      ]);
    }
    const viewsByShare = new Map<string, number>();
    for (const v of filteredViews) {
      viewsByShare.set(
        v.shareLinkId,
        (viewsByShare.get(v.shareLinkId) ?? 0) + 1,
      );
    }
    for (const sh of filteredShares) {
      const expired = sh.expiresAt && new Date(sh.expiresAt) < new Date();
      const status = sh.revoked ? "revoked" : expired ? "expired" : "active";
      rows.push([
        "Share Link",
        "share",
        sh.name,
        sh.recipientName ?? "",
        "",
        status,
        String(viewsByShare.get(sh.id) ?? 0),
        format(sh.createdAt, "yyyy-MM-dd HH:mm:ss"),
        "",
      ]);
    }
    const csv = rows
      .map((r) =>
        r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dashboard-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    const [{ default: jsPDF }, autoTableModule] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
    const autoTable =
      (autoTableModule as typeof autoTableModule).default ??
      (autoTableModule as typeof autoTableModule);
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Portfolio Dashboard Report", 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated ${format(new Date(), "PPP")}`, 14, 25);
    doc.text(
      `Range: ${dateRange} · Industry: ${industryId === "all" ? "All" : (tax.industries.find((i) => i.id === industryId)?.name ?? "")} · Client: ${clientId === "all" ? "All" : (tax.clients.find((c) => c.id === clientId)?.name ?? "")}`,
      14,
      31,
    );

    doc.setTextColor(0);
    doc.setFontSize(13);
    doc.text("Summary", 14, 42);
    autoTable(doc, {
      startY: 46,
      head: [["Metric", "Value"]],
      body: [
        ["Case studies", String(filteredStudies.length)],
        ["Published", String(stats.published)],
        ["Drafts", String(stats.drafts)],
        ["Active shares", String(stats.activeShares)],
        ["Expired shares", String(stats.expiredShares)],
        ["Total views (filtered)", String(stats.totalViews)],
      ],
    });

    doc.setFontSize(13);
    doc.text(
      "Case Studies",
      14,
      (doc as unknown as JsPDFDocument).lastAutoTable.finalY + 12,
    );
    autoTable(doc, {
      startY: (doc as unknown as JsPDFDocument).lastAutoTable.finalY + 16,
      head: [["Title", "Client", "Industry", "Status", "Updated"]],
      body: filteredStudies.map((s) => [
        s.title,
        s.client?.name ?? "—",
        s.industry?.name ?? "—",
        s.status,
        format(s.updatedAt, "PP"),
      ]),
      styles: { fontSize: 9 },
    });

    const viewsByShare = new Map<string, number>();
    for (const v of filteredViews) {
      viewsByShare.set(
        v.shareLinkId,
        (viewsByShare.get(v.shareLinkId) ?? 0) + 1,
      );
    }
    doc.setFontSize(13);
    doc.text(
      "Share Links",
      14,
      (doc as unknown as JsPDFDocument).lastAutoTable.finalY + 12,
    );
    autoTable(doc, {
      startY: (doc as unknown as JsPDFDocument).lastAutoTable.finalY + 16,
      head: [["Name", "Recipient", "Views", "Status", "Created"]],
      body: filteredShares.map((s) => {
        const expired = s.expiresAt && new Date(s.expiresAt) < new Date();
        const status = s.revoked ? "revoked" : expired ? "expired" : "active";
        return [
          s.name,
          s.recipientName ?? s.recipientEmail ?? "—",
          String(viewsByShare.get(s.id) ?? 0),
          status,
          format(s.createdAt, "PP"),
        ];
      }),
      styles: { fontSize: 9 },
    });

    doc.save(`dashboard-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  /* ---- filter helpers ---- */
  const filtersActive =
    dateRange !== "30d" || industryId !== "all" || clientId !== "all";
  const resetFilters = () => {
    setDateRange("30d");
    setIndustryId("all");
    setClientId("all");
  };

  /* ---- render ---- */
  if (loading) {
    return (
      <div className="mx-auto max-w-7xl p-6 md:p-10">
        <div className="text-sm text-muted-foreground">Loading dashboard…</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-6 md:p-10">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All your work at a glance — case studies, clients, and shared
            portfolios.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm">
                  <DownloadSimpleIcon size={16} className="mr-2" /> Export
                  report
                </Button>
              }
            ></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportCSV}>
                <FileXlsIcon size={16} className="mr-2" /> Download CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportPDF}>
                <FilePdfIcon size={16} className="mr-2" /> Download PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={
              <Link href="/shares/new">
                <ShareIcon size={16} className="mr-2" /> New share
              </Link>
            }
          ></Button>
          <Button
            size="sm"
            nativeButton={false}
            render={
              <Link href="/case-studies/new">
                <PlusIcon size={16} className="mr-2" /> New case study
              </Link>
            }
          ></Button>
        </div>
      </div>

      {/* Filters */}
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
              value={dateRange}
              onValueChange={(v) => setDateRange(v as DateRange)}
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
            <Select
              value={industryId}
              onValueChange={(v) => setIndustryId(v ?? "all")}
            >
              <SelectTrigger id="industry" className="w-45">
                <SelectValue placeholder="Select industry">
                  {industryId === "all"
                    ? "All industries"
                    : tax.industries.find((i) => i.id === industryId)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All industries</SelectItem>
                {tax.industries.map((i) => (
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
              value={clientId}
              onValueChange={(v) => setClientId(v ?? "all")}
            >
              <SelectTrigger id="client" className="w-45">
                <SelectValue placeholder="Select client">
                  {clientId === "all"
                    ? "All clients"
                    : tax.clients.find((c) => c.id === clientId)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All clients</SelectItem>
                {tax.clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {filtersActive && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <XIcon size={16} className="mr-1" /> Reset
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Stat cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<FileTextIcon size={16} />}
          label="Case studies"
          value={filteredStudies.length}
          sub={`${stats.published} published · ${stats.drafts} drafts`}
        />
        <StatCard
          icon={<BriefcaseIcon size={16} />}
          label="Clients"
          value={tax.clients.length}
          sub={`${tax.industries.length} industries`}
        />
        <StatCard
          icon={<ShareIcon size={16} />}
          label="Active shares"
          value={stats.activeShares}
          sub={`${filteredShares.length} total · ${stats.expiredShares} expired`}
        />
        <StatCard
          icon={<EyeIcon size={16} />}
          label="Views in range"
          value={stats.totalViews}
          sub="From share links"
        />
      </div>

      {/* Chart */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Share views over time</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {chartData.reduce((sum, d) => sum + d.views, 0)} views across the
              selected range
            </p>
          </div>
          <Select
            value={granularity}
            onValueChange={(v) => setGranularity(v as Granularity)}
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
          <div className="h-65 w-full">
            <canvas ref={chartRef} />
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Recent activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PulseIcon size={16} /> Recent activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {activityFeed.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="flex items-start gap-3 rounded-md p-2 transition-colors hover:bg-muted"
              >
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${item.type === "case_study"
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
                      —{" "}
                      {item.type === "case_study" ? "case study" : "share link"}{" "}
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
            ))}
            {!activityFeed.length && (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                No recent activity in this range.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Work by industry */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Work by industry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {industryBreakdown.map(([name, count]) => (
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
            {!industryBreakdown.length && (
              <div className="text-sm text-muted-foreground">
                No data in range.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Top clients */}
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
            {clientBreakdown.map((c) => (
              <div
                key={c.name}
                className="flex items-center gap-3 rounded-md p-2 hover:bg-muted"
              >
                {c.logo ? (
                  <img
                    src={c.logo}
                    alt=""
                    className="h-8 w-8 rounded object-contain"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
                    <BriefcaseIcon
                      size={16}
                      className="text-muted-foreground"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1 truncate text-sm font-medium">
                  {c.name}
                </div>
                <Badge variant="secondary">
                  {c.count} {c.count === 1 ? "study" : "studies"}
                </Badge>
              </div>
            ))}
            {!clientBreakdown.length && (
              <div className="text-sm text-muted-foreground">
                No client work in range.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Most viewed shares */}
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
            {topShares.map((s) => {
              const expired = s.expiresAt && new Date(s.expiresAt) < new Date();
              const status = s.revoked
                ? "revoked"
                : expired
                  ? "expired"
                  : "active";
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
            {!topShares.length && (
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
