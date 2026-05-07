import type { listTaxonomies } from "@/actions/content";

type TaxonomiesResult = Awaited<ReturnType<typeof listTaxonomies>>;

export type TaxonomyDataMap = Extract<TaxonomiesResult, { ok: true }>["data"];
