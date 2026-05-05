import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Taxonomy } from "@/types/case-studies";

export function Field({
  label,
  value,
  onChange,
  rows = 2,
}: {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
  rows?: number;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Textarea
        rows={rows}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
      />
    </div>
  );
}

export function TagSelector({
  label,
  items,
  selected,
  onToggle,
}: {
  label: string;
  items: Taxonomy[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {items.length === 0 ? (
        <div className="text-xs text-muted-foreground">
          None defined yet — add some in Taxonomies.
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((it) => (
            <button
              key={it.id}
              type="button"
              onClick={() => onToggle(it.id)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                selected.includes(it.id)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-muted"
              }`}
            >
              {it.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
