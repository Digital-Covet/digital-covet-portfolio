"use client";

import {
  DownloadSimpleIcon,
  FilePdfIcon,
  FileXlsIcon,
} from "@phosphor-icons/react";
import { format } from "date-fns";
import type { CaseStudyListItemWithDates } from "@/actions/content";
import type { ShareLinkItem } from "@/actions/share";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DashboardStats } from "@/hooks/useDashboardDerivedData";
import type { Taxonomies } from "@/types/case-studies";
import { getShareStatus } from "@/utils/shareStatus";

interface JsPDFDocument {
  lastAutoTable: { finalY: number };
}

interface ExportButtonProps {
  filteredStudies: CaseStudyListItemWithDates[];
  filteredShares: ShareLinkItem[];
  /** Pre-computed from useDashboardDerivedData — do not recompute here. */
  viewCountByShareId: Map<string, number>;
  stats: DashboardStats;
  taxonomies: Taxonomies;
  dateRange: string;
  industryId: string;
  clientId: string;
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
    const autoTable =
      (autoTableModule as typeof autoTableModule).default ??
      (autoTableModule as typeof autoTableModule);

    const doc = new jsPDF();

    const industryLabel =
      industryId === "all"
        ? "All"
        : (taxonomies.industries.find((i) => i.id === industryId)?.name ?? "");
    const clientLabel =
      clientId === "all"
        ? "All"
        : (taxonomies.clients.find((c) => c.id === clientId)?.name ?? "");

    doc.setFontSize(18);
    doc.text("Portfolio Dashboard Report", 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated ${format(new Date(), "PPP")}`, 14, 25);
    doc.text(
      `Range: ${dateRange} · Industry: ${industryLabel} · Client: ${clientLabel}`,
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

    const afterSummary = (doc as unknown as JsPDFDocument).lastAutoTable.finalY;
    doc.setFontSize(13);
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
      styles: { fontSize: 9 },
    });

    const afterStudies = (doc as unknown as JsPDFDocument).lastAutoTable.finalY;
    doc.setFontSize(13);
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
      styles: { fontSize: 9 },
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
