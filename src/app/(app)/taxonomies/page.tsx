import { listTaxonomies } from "@/actions/content";
import { TaxonomyList } from "@/components/taxonomies/taxonomy-list";

export default async function TaxonomiesPage() {
  const data = await listTaxonomies();

  return (
    <div className="p-6 md:p-10">
      <h1 className="text-3xl font-bold tracking-tight"> Taxonomies </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Master lists for tagging case studies.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <TaxonomyList
          title="Industries"
          type="industries"
          items={data.industries}
        />
        <TaxonomyList
          title="Work Categories"
          type="work_categories"
          items={data.categories}
        />
        <TaxonomyList title="Services" type="services" items={data.services} />
      </div>
    </div>
  );
}
