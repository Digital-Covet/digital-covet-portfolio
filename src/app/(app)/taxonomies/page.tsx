import { listTaxonomies } from "@/actions/content";
import { TaxonomiesClient } from "@/components/taxonomies/taxonomies-client";

export const dynamic = "force-dynamic";

export default async function TaxonomiesPage() {
  const result = await listTaxonomies();

  if (!result.ok) {
    return (
      <div className="p-6 md:p-10">
        <p className="text-red-500">Failed to load taxonomies</p>
      </div>
    );
  }

  const data = result.data;

  return (
    <div className="p-6 md:p-10">
      <h1 className="text-3xl font-bold tracking-tight"> Taxonomies </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Master lists for tagging case studies.
      </p>

      <div className="mt-8">
        <TaxonomiesClient data={data} />
      </div>
    </div>
  );
}