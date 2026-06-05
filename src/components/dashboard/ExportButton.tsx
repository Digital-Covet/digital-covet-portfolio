"use client";

import {
  DownloadSimpleIcon,
  FilePdfIcon,
  FileXlsIcon,
} from "@phosphor-icons/react";
import { format } from "date-fns";
import type { ShareLinkItem } from "@/actions/share";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DashboardStats } from "@/hooks/useDashboardDerivedData";
import type {
  CaseStudyListItemWithDates,
  Taxonomies,
} from "@/types/case-studies";
import { getShareStatus } from "@/utils/shareStatus";

const pdfTheme = {
  background: "#FFFFFF",
  foreground: "#433C47",
  primary: "#B8411C",
  primaryForeground: "#FFFFFF",
  secondary: "#433C47",
  muted: "#EDEDED",
  mutedForeground: "#746C79",
  border: "#E0DADA",
  accent: "#F7E8E3",
  destructive: "#D14D34",
} as const;

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;

  const int = Number.parseInt(value, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

const toRgb = (hex: string) => hexToRgb(hex);

interface JsPDFDocument {
  lastAutoTable: { finalY: number };
}

interface ExportButtonProps {
  filteredStudies: CaseStudyListItemWithDates[];
  filteredShares: ShareLinkItem[];
  viewCountByShareId: Map<string, number>;
  stats: DashboardStats;
  taxonomies: Taxonomies;
  dateRange: string;
  industryId: string;
  clientId: string;
  clientBreakdown: { name: string; count: number }[];
}

export function ExportButton({
  filteredStudies,
  filteredShares,
  viewCountByShareId,
  stats,
  taxonomies,
  dateRange,
  industryId,
  clientId,
  clientBreakdown,
}: ExportButtonProps) {
  function exportCSV() {
    const rows: string[][] = [
      [
        "Section",
        "Type",
        "Name",
        "Client",
        "Industry",
        "Status",
        "Views",
        "Created",
        "Updated",
      ],
    ];
    for (const s of filteredStudies) {
      rows.push([
        "Case Study",
        "case_study",
        s.title,
        s.client?.name ?? "",
        s.keyBusinesses.map((k) => k.name).join(", "),
        s.status,
        "",
        format(s.createdAt, "yyyy-MM-dd HH:mm:ss"),
        format(s.updatedAt, "yyyy-MM-dd HH:mm:ss"),
      ]);
    }
    for (const sh of filteredShares) {
      rows.push([
        "Share Link",
        "share",
        sh.name,
        sh.recipientName ?? "",
        "",
        getShareStatus(sh),
        String(viewCountByShareId.get(sh.id) ?? 0),
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
  }

  async function exportPDF() {
    const [{ default: jsPDF }, autoTableModule] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);

    const autoTable = (autoTableModule as any).default ?? autoTableModule;
    const doc = new jsPDF();

    const industryLabel =
      industryId === "all"
        ? "All"
        : (taxonomies.industries.find((i) => i.id === industryId)?.name ?? "");
    const clientLabel =
      clientId === "all"
        ? "All"
        : (taxonomies.clients.find((c) => c.id === clientId)?.name ?? "");

    const primary = toRgb(pdfTheme.primary);
    const primaryForeground = toRgb(pdfTheme.primaryForeground);
    const muted = toRgb(pdfTheme.muted);
    const mutedForeground = toRgb(pdfTheme.mutedForeground);
    const foreground = toRgb(pdfTheme.foreground);
    const border = toRgb(pdfTheme.border);

    const tableStyles = {
      theme: "grid" as const,
      styles: {
        font: "helvetica",
        fontStyle: "normal" as const,
        fontSize: 9,
        textColor: foreground,
        lineColor: border,
        lineWidth: 0.2,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: primary,
        textColor: primaryForeground,
        font: "helvetica",
        fontStyle: "normal" as const,
      },
      alternateRowStyles: {
        fillColor: muted,
      },
    };

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(...primary);
    doc.text("Portfolio Dashboard Report", 14, 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...mutedForeground);
    doc.text(`Generated ${format(new Date(), "PPP")}`, 14, 25);
    doc.text(
      `Range: ${dateRange} · Industry: ${industryLabel} · Client: ${clientLabel}`,
      14,
      31,
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...foreground);
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
      ...tableStyles,
    });

    const afterSummary = (doc as unknown as JsPDFDocument).lastAutoTable.finalY;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...foreground);
    doc.text("Case Studies", 14, afterSummary + 12);
    autoTable(doc, {
      startY: afterSummary + 16,
      head: [["Title", "Client", "Industry", "Status", "Updated"]],
      body: filteredStudies.map((s) => [
        s.title,
        s.client?.name ?? "—",
        s.keyBusinesses.map((k) => k.name).join(", ") || "—",
        s.status,
        format(s.updatedAt, "PP"),
      ]),
      ...tableStyles,
    });

    const afterStudies = (doc as unknown as JsPDFDocument).lastAutoTable.finalY;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...foreground);
    doc.text("Share Links", 14, afterStudies + 12);
    autoTable(doc, {
      startY: afterStudies + 16,
      head: [["Name", "Recipient", "Views", "Status", "Created"]],
      body: filteredShares.map((s) => [
        s.name,
        s.recipientName ?? s.recipientEmail ?? "—",
        String(viewCountByShareId.get(s.id) ?? 0),
        getShareStatus(s),
        format(s.createdAt, "PP"),
      ]),
      ...tableStyles,
    });

    const afterShares = (doc as unknown as JsPDFDocument).lastAutoTable.finalY;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...foreground);
    doc.text("Top Clients", 14, afterShares + 12);
    autoTable(doc, {
      startY: afterShares + 16,
      head: [["Client Name", "Case Studies"]],
      body: clientBreakdown.map((client) => [
        client.name,
        String(client.count),
      ]),
      ...tableStyles,
    });

    doc.save(`dashboard-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm">
            <DownloadSimpleIcon size={16} className="mr-2" /> Export report
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportCSV}>
          <FileXlsIcon size={16} className="mr-2" /> Download CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportPDF}>
          <FilePdfIcon size={16} className="mr-2" /> Download PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
