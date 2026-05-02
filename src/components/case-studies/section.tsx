import { PlusIcon, TrashIcon, XIcon } from "@phosphor-icons/react";
import { FileUploader, ImagePreview } from "@/components/file-uploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Attachment,
  Client,
  Metric,
  Taxonomy,
} from "@/types/case-studies";
import { slugify } from "@/utils/case-studies";
import { Field, TagSelector } from "./shared";

type BasicsProps = {
  title: string;
  slug: string;
  clientId: string | null;
  industryId: string | null;
  projectDate: string | null;
  videoEmbedUrl: string | null;
  clients: Client[];
  industries: Taxonomy[];
  onTitleChange: (title: string) => void;
  onSlugChange: (slug: string) => void;
  onClientChange: (id: string | null) => void;
  onIndustryChange: (id: string | null) => void;
  onProjectDateChange: (date: string | null) => void;
  onVideoEmbedChange: (url: string | null) => void;
};

export function BasicsSection({
  title,
  slug,
  clientId,
  industryId,
  projectDate,
  videoEmbedUrl,
  clients,
  industries,
  onTitleChange,
  onSlugChange,
  onClientChange,
  onIndustryChange,
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
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input
              value={slug}
              onChange={(e) => onSlugChange(slugify(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Client</Label>
            <Select
              value={clientId ?? "none"}
              onValueChange={(v) => onClientChange(v === "none" ? null : v)}
            >
              <SelectTrigger>
                <SelectValue />
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
            <Label>Industry</Label>
            <Select
              value={industryId ?? "none"}
              onValueChange={(v) => onIndustryChange(v === "none" ? null : v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None —</SelectItem>
                {industries.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Project date</Label>
            <Input
              type="date"
              value={projectDate ?? ""}
              onChange={(e) => onProjectDateChange(e.target.value || null)}
            />
          </div>
          <div className="space-y-2">
            <Label>Video embed URL (YouTube/Vimeo)</Label>
            <Input
              value={videoEmbedUrl ?? ""}
              onChange={(e) => onVideoEmbedChange(e.target.value || null)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

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
          onToggle={onToggleCategory}
        />
        <TagSelector
          label="Services"
          items={services}
          selected={selectedServices}
          onToggle={onToggleService}
        />
      </CardContent>
    </Card>
  );
}

type MediaProps = {
  heroImageUrl: string | null;
  galleryUrls: string[];
  attachments: Attachment[];
  onHeroChange: (url: string | null) => void;
  onGalleryAdd: (url: string) => void;
  onGalleryRemove: (index: number) => void;
  onAttachmentAdd: (attachment: Attachment) => void;
  onAttachmentRemove: (index: number) => void;
};

export function MediaSection({
  heroImageUrl,
  galleryUrls,
  attachments,
  onHeroChange,
  onGalleryAdd,
  onGalleryRemove,
  onAttachmentAdd,
  onAttachmentRemove,
}: MediaProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Media</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Hero image</Label>
          <div className="flex flex-wrap items-center gap-3">
            {heroImageUrl && (
              <ImagePreview
                url={heroImageUrl}
                onRemove={() => onHeroChange(null)}
              />
            )}
            <FileUploader
              bucket="case-study-media"
              accept="image/*"
              label="Upload hero"
              onUploaded={(f) => onHeroChange(f.url)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Gallery</Label>
          <div className="flex flex-wrap items-center gap-3">
            {galleryUrls.map((u, i) => (
              <ImagePreview
                key={u + i}
                url={u}
                onRemove={() => onGalleryRemove(i)}
              />
            ))}
            <FileUploader
              bucket="case-study-media"
              accept="image/*"
              label="Add image"
              onUploaded={(f) => onGalleryAdd(f.url)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Attachments (PDFs, decks)</Label>
          <div className="space-y-2">
            {attachments.map((a, i) => (
              <div
                key={a.url + i}
                className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm"
              >
                <a
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-primary hover:underline"
                >
                  {a.name}
                </a>
                <button type="button" onClick={() => onAttachmentRemove(i)}>
                  <XIcon size={16} className="text-muted-foreground" />
                </button>
              </div>
            ))}
            <FileUploader
              bucket="case-study-attachments"
              accept=".pdf"
              label="Add PDF"
              onUploaded={(f) => onAttachmentAdd({ name: f.name, url: f.url })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type StoryProps = {
  description: string | null;
  challenge: string | null;
  solution: string | null;
  results: string | null;
  onUpdate: <K extends "description" | "challenge" | "solution" | "results">(
    key: K,
    value: string | null,
  ) => void;
};

export function StorySection({
  description,
  challenge,
  solution,
  results,
  onUpdate,
}: StoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Story</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field
          label="Description"
          value={description}
          onChange={(v) => onUpdate("description", v)}
          rows={5}
        />
        <Field
          label="Challenge"
          value={challenge}
          onChange={(v) => onUpdate("challenge", v)}
        />
        <Field
          label="Solution"
          value={solution}
          onChange={(v) => onUpdate("solution", v)}
        />
        <Field
          label="Results"
          value={results}
          onChange={(v) => onUpdate("results", v)}
        />
      </CardContent>
    </Card>
  );
}

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
          <PlusIcon size={16} className="mr-2" /> Add metric
        </Button>
      </CardContent>
    </Card>
  );
}

type TestimonialProps = {
  quote: string | null;
  author: string | null;
  title: string | null;
  onUpdate: <K extends "quote" | "author" | "title">(
    key: K,
    value: string | null,
  ) => void;
};

export function TestimonialSection({
  quote,
  author,
  title,
  onUpdate,
}: TestimonialProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Testimonial</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field
          label="Quote"
          value={quote}
          onChange={(v) => onUpdate("quote", v)}
          rows={3}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Author</Label>
            <Input
              value={author ?? ""}
              onChange={(e) => onUpdate("author", e.target.value || null)}
            />
          </div>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={title ?? ""}
              onChange={(e) => onUpdate("title", e.target.value || null)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
