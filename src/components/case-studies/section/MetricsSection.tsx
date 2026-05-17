import { PlusIcon, TrashIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Metric } from "@/types/case-studies";

type MetricsProps = {
  metrics: Metric[];
  onAdd: () => void;
  onUpdate: (index: number, updates: Partial<Metric>) => void;
  onRemove: (index: number) => void;
};

export function MetricsSection({
  metrics,
  onAdd,
  onUpdate,
  onRemove,
}: MetricsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Metrics (KPIs)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {metrics.map((m, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr_auto]">
            <Input
              placeholder="Label (e.g. ROI)"
              value={m.label}
              onChange={(e) => onUpdate(i, { label: e.target.value })}
            />
            <Input
              placeholder="Value (e.g. 320)"
              value={m.value}
              onChange={(e) => onUpdate(i, { value: e.target.value })}
            />
            <Input
              placeholder="Unit (e.g. %)"
              value={m.unit ?? ""}
              onChange={(e) => onUpdate(i, { unit: e.target.value || null })}
            />
            <Button variant="ghost" size="icon" onClick={() => onRemove(i)}>
              <TrashIcon size={16} />
            </Button>
          </div>
        ))}

        <Button variant="outline" size="sm" onClick={onAdd}>
          <PlusIcon size={16} className="mr-2" />
          Add metric
        </Button>
      </CardContent>
    </Card>
  );
}
