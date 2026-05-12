"use client";
import {
  BasicsSection,
  MediaSection,
  MetricsSection,
  StorySection,
  TagsSection,
  TestimonialSection,
} from "@/components/case-studies/section";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCaseStudyForm } from "@/hooks/useCaseStudyForm";
import type { CaseStudyResponse, Taxonomies } from "@/types/case-studies";

interface Props {
  id: string;
  initialData: CaseStudyResponse | null;
  taxonomies: Taxonomies;
}

export function CaseStudyEditorShell({ id, initialData, taxonomies }: Props) {
  const {
    form,
    saving,
    lastSavedAt,
    isNew,
    updateStory,
    updateTestimonial,
    toggleCategory,
    toggleService,
    addMetric,
    updateMetric,
    removeMetric,
    removeGalleryImage,
    addGalleryImage,
    addAttachment,
    removeAttachment,
    save,
    basicsHandlers,
    mediaHandlers,
  } = useCaseStudyForm({ id, initialData, taxonomies });

  return (
    <>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight">
          {isNew ? "New case study" : "Edit case study"}
        </h1>
        <div className="flex items-center gap-2">
          {lastSavedAt && (
            <span className="text-xs text-muted-foreground">
              {saving ? "Saving…" : `Saved ${lastSavedAt.toLocaleTimeString()}`}
            </span>
          )}
          <Select
            value={form.basics.status}
            onValueChange={(v) =>
              basicsHandlers.onStatusChange(
                v as "draft" | "published" | "archived",
              )
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        <BasicsSection
          title={form.basics.title}
          slug={form.basics.slug}
          clientId={form.basics.clientId}
          sectorId={form.basics.sectorId}
          industryId={form.basics.industryId}
          keyBusinessIds={form.basics.keyBusinessIds}
          businessModelIds={form.basics.businessModelIds}
          projectDate={form.basics.projectDate}
          videoEmbedUrl={form.media.videoEmbedUrl}
          clients={taxonomies.clients}
          sectors={taxonomies.sectors}
          industries={taxonomies.industries}
          keyBusinesses={taxonomies.keyBusinesses}
          businessModels={taxonomies.businessModels}
          onTitleChange={basicsHandlers.onTitleChange}
          onSlugChange={basicsHandlers.onSlugChange}
          onClientChange={basicsHandlers.onClientChange}
          onSectorChange={basicsHandlers.onSectorChange}
          onIndustryChange={basicsHandlers.onIndustryChange}
          onKeyBusinessIdsChange={basicsHandlers.onKeyBusinessIdsChange}
          onBusinessModelIdsChange={basicsHandlers.onBusinessModelIdsChange}
          onProjectDateChange={basicsHandlers.onProjectDateChange}
          onVideoEmbedChange={mediaHandlers.onVideoEmbedChange}
        />

        <TagsSection
          categories={taxonomies.categories}
          services={taxonomies.services}
          selectedCategories={form.categoryIds}
          selectedServices={form.serviceIds}
          onToggleCategory={toggleCategory}
          onToggleService={toggleService}
        />

        <MediaSection
          heroImageUrl={form.media.heroImageUrl}
          galleryUrls={form.media.galleryUrls}
          attachments={form.media.attachments}
          onHeroChange={mediaHandlers.onHeroChange}
          onGalleryAdd={addGalleryImage}
          onGalleryRemove={removeGalleryImage}
          onAttachmentAdd={addAttachment}
          onAttachmentRemove={removeAttachment}
        />

        <StorySection
          description={form.story.description}
          challenge={form.story.challenge}
          solution={form.story.solution}
          results={form.story.results}
          onUpdate={updateStory}
        />

        <MetricsSection
          metrics={form.metrics}
          onAdd={addMetric}
          onUpdate={updateMetric}
          onRemove={removeMetric}
        />

        <TestimonialSection
          quote={form.testimonial.quote}
          author={form.testimonial.author}
          title={form.testimonial.title}
          onUpdate={updateTestimonial}
        />
      </div>
    </>
  );
}
