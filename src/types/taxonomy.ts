import type { listTaxonomies } from "@/actions/taxonomies";

type TaxonomiesResult = Awaited<ReturnType<typeof listTaxonomies>>;

export type TaxonomyDataMap = Extract<TaxonomiesResult, { ok: true }>["data"];

export type Taxonomy = {
  id: string;
  name: string;
};

export type IndustryWithSector = Taxonomy & {
  sectorId: string | null;
};

export type KeyBusinessWithIndustry = Taxonomy & {
  industryId: string | null;
};
