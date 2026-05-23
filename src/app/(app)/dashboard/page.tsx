import { connection } from "next/server";
import { listCaseStudies } from "@/actions/case-studies";
import { getDashboardViewStats, listShares } from "@/actions/share";
import { listTaxonomies } from "@/actions/taxonomies";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardData } from "@/hooks/useDashboardData";
export default async function Page() {
  await connection();
  const [studiesResult, sharesResult, taxResult, viewStatsResult] =
    await Promise.all([
      listCaseStudies(),
      listShares(),
      listTaxonomies(),
      getDashboardViewStats(),
    ]);
  if (!studiesResult.ok) {
    return errorCard(studiesResult.error.message);
  }
  if (!sharesResult.ok) {
    return errorCard(sharesResult.error.message);
  }
  if (!taxResult.ok) {
    return errorCard(taxResult.error.message);
  }
  if (!viewStatsResult.ok) {
    return errorCard(viewStatsResult.error.message);
  }
  const initialData: DashboardData = {
    studies: studiesResult.data.studies,
    shares: sharesResult.data.shares,
    taxonomies: taxResult.data,
    viewStats: viewStatsResult.data,
  };
  return <DashboardView initialData={initialData} />;
}
function errorCard(message: string) {
  return (
    <div className="mx-auto w-full max-w-7xl p-6 md:p-10 min-w-0">
      <Card>
        <CardContent className="p-6 text-sm text-destructive">
          Failed to load dashboard: {message}
        </CardContent>
      </Card>
    </div>
  );
}
