import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Taxonomy } from "@/types/taxonomy";
import { TagSelector } from "../shared";

type TagsProps = {
  categories: Taxonomy[];
  services: Taxonomy[];
  selectedCategories: string[];
  selectedServices: string[];
  onToggleCategory: (id: string) => void;
  onToggleService: (id: string) => void;
};

export function TagsSection({
  categories,
  services,
  selectedCategories,
  selectedServices,
  onToggleCategory,
  onToggleService,
}: TagsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tags</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <TagSelector
          label="Work categories"
          items={categories}
          selected={selectedCategories}
          onToggleAction={onToggleCategory}
        />
        <TagSelector
          label="Services"
          items={services}
          selected={selectedServices}
          onToggleAction={onToggleService}
        />
      </CardContent>
    </Card>
  );
}
