"use client";

import { useState } from "react";
import { TaxonomyList } from "@/components/taxonomies/taxonomy-list";

interface TaxonomyData {
  id: string;
  name: string;
  sectorId?: string | null;
  industryId?: string | null;
}

interface TaxonomyDataMap {
  sectors: TaxonomyData[];
  industries: TaxonomyData[];
  keyBusinesses: TaxonomyData[];
  categories: TaxonomyData[];
  services: TaxonomyData[];
}

export function TaxonomiesClient({
  data,
}: {
  data: TaxonomyDataMap;
}) {
  const [selectedSectorId, setSelectedSectorId] = useState<string | null>(null);
  const [selectedIndustryId, setSelectedIndustryId] = useState<string | null>(null);

  const visibleIndustries = selectedSectorId
    ? data.industries.filter((i) => i.sectorId === selectedSectorId)
    : [];

  const visibleKeyBusinesses = selectedIndustryId
    ? data.keyBusinesses.filter((kb) => kb.industryId === selectedIndustryId)
    : [];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <TaxonomyList
        title="Sectors"
        type="sectors"
        items={data.sectors}
        onSelect={setSelectedSectorId}
      />
      {selectedSectorId && (
        <TaxonomyList
          title="Industries"
          type="industries"
          items={visibleIndustries}
          parents={data.sectors}
          parentType="sectors"
          onSelect={setSelectedIndustryId}
        />
      )}
      {selectedIndustryId && (
        <TaxonomyList
          title="Key Businesses"
          type="key_businesses"
          items={visibleKeyBusinesses}
          parents={visibleIndustries}
          parentType="industries"
        />
      )}
      <TaxonomyList
        title="Work Categories"
        type="work_categories"
        items={data.categories}
      />
      <TaxonomyList title="Services" type="services" items={data.services} />
    </div>
  );
}