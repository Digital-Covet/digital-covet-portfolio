import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  Client,
  IndustryWithSector,
  KeyBusinessWithIndustry,
  Taxonomy,
} from "@/types/case-studies";
import { slugify } from "@/utils/case-studies/case-studies";

const YOUTUBE_VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

function isValidVideoEmbedUrl(raw: string): boolean {
  if (!raw) return true;
  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      const match = url.pathname.match(/^\/embed\/([a-zA-Z0-9_-]+)$/);
      return match !== null && YOUTUBE_VIDEO_ID_REGEX.test(match[1]);
    }
    return false;
  } catch {
    return false;
  }
}

type BasicsProps = {
  title: string;
  slug: string;
  clientId: string | null;
  sectorId: string | null;
  industryId: string | null;
  keyBusinessIds: string[];
  businessModelIds: string[];
  projectDate: string | null;
  videoEmbedUrl: string | null;
  clients: Client[];
  sectors: Taxonomy[];
  industries: IndustryWithSector[];
  keyBusinesses: KeyBusinessWithIndustry[];
  businessModels: Taxonomy[];
  onTitleChange: (title: string) => void;
  onSlugChange: (slug: string) => void;
  onClientChange: (id: string | null) => void;
  onSectorChange: (id: string | null) => void;
  onIndustryChange: (id: string | null) => void;
  onKeyBusinessIdsChange: (ids: string[]) => void;
  onBusinessModelIdsChange: (ids: string[]) => void;
  onProjectDateChange: (date: string | null) => void;
  onVideoEmbedChange: (url: string | null) => void;
};

export function BasicsSection({
  title,
  slug,
  clientId,
  sectorId,
  industryId,
  keyBusinessIds,
  businessModelIds,
  projectDate,
  videoEmbedUrl,
  clients,
  sectors,
  industries,
  keyBusinesses,
  businessModels,
  onTitleChange,
  onSlugChange,
  onClientChange,
  onSectorChange,
  onIndustryChange,
  onKeyBusinessIdsChange,
  onBusinessModelIdsChange,
  onProjectDateChange,
  onVideoEmbedChange,
}: BasicsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Basics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => onSlugChange(slugify(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client">Client</Label>
            <Select
              value={clientId ?? "none"}
              onValueChange={(v) => onClientChange(v === "none" ? null : v)}
            >
              <SelectTrigger id="client" className="w-full">
                <SelectValue>
                  {clientId && clientId !== "none"
                    ? clients.find((c) => c.id === clientId)?.name
                    : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None —</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sector">Sector</Label>
            <Select
              value={sectorId ?? "none"}
              onValueChange={(v) => {
                onSectorChange(v === "none" ? null : v);
                onIndustryChange(null);
                onKeyBusinessIdsChange([]);
              }}
            >
              <SelectTrigger id="sector" className="w-full">
                <SelectValue>
                  {sectorId && sectorId !== "none"
                    ? sectors.find((s) => s.id === sectorId)?.name
                    : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None —</SelectItem>
                {sectors.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Select
              value={industryId ?? "none"}
              onValueChange={(v) => {
                onIndustryChange(v === "none" ? null : v);
                onKeyBusinessIdsChange([]);
              }}
              disabled={!sectorId}
            >
              <SelectTrigger id="industry" className="w-full">
                <SelectValue>
                  {industryId && industryId !== "none"
                    ? industries.find((i) => i.id === industryId)?.name
                    : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None —</SelectItem>
                {industries
                  .filter((i) => !sectorId || i.sectorId === sectorId)
                  .map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Key Business</Label>
            <div className="space-y-2 border p-3 rounded">
              {industryId ? (
                keyBusinesses
                  .filter((k) => k.industryId === industryId)
                  .map((k) => (
                    <label
                      key={k.id}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={keyBusinessIds.includes(k.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            onKeyBusinessIdsChange([...keyBusinessIds, k.id]);
                          } else {
                            onKeyBusinessIdsChange(
                              keyBusinessIds.filter((id) => id !== k.id),
                            );
                          }
                        }}
                      />
                      {k.name}
                    </label>
                  ))
              ) : (
                <p className="text-xs text-muted-foreground">
                  Select an industry first
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Business Models</Label>
            <div className="space-y-2 border p-3 rounded">
              {businessModels.length > 0 ? (
                businessModels.map((m) => (
                  <label
                    key={m.id}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={businessModelIds.includes(m.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          onBusinessModelIdsChange([...businessModelIds, m.id]);
                        } else {
                          onBusinessModelIdsChange(
                            businessModelIds.filter((id) => id !== m.id),
                          );
                        }
                      }}
                    />
                    {m.name}
                  </label>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">
                  No business models defined yet
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Project date</Label>
            <DatePicker value={projectDate} onChange={onProjectDateChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="video">Video embed URL (YouTube)</Label>
            <Input
              id="video"
              value={videoEmbedUrl ?? ""}
              placeholder="https://www.youtube.com/embed/VIDEO_ID"
              onChange={(e) => onVideoEmbedChange(e.target.value || null)}
            />
            {videoEmbedUrl && !isValidVideoEmbedUrl(videoEmbedUrl) && (
              <p className="text-xs text-destructive">
                Enter a valid YouTube embed URL (e.g.
                https://www.youtube.com/embed/VIDEO_ID)
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
