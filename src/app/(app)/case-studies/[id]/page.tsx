"use client";

import { ArrowLeftIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useParams } from "next/navigation";
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

export default function CaseStudyEditorPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const {
    form,
    taxonomies,
    saving,
    loading,
    isNew,
    updateBasics,
    updateMedia,
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
    handleTitleChange,
    save,
  } = useCaseStudyForm(id);

  if (loading) {
    return <div className="p-10 text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="p-6 md:p-10">
      <Link
        href="/case-studies"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon size={16} className="mr-1" /> Back
      </Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight">
          {isNew ? "New case study" : "Edit case study"}
        </h1>
        <div className="flex items-center gap-2">
          <Select
            value={form.basics.status}
            onValueChange={(v) =>
              updateBasics("status", v as "draft" | "published")
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Select status">
                {form.basics.status === "draft"
                  ? "Draft"
                  : form.basics.status === "published"
                    ? "Published"
                    : form.basics.status}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
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
          industryId={form.basics.industryId}
          projectDate={form.basics.projectDate}
          videoEmbedUrl={form.media.videoEmbedUrl}
          clients={taxonomies.clients}
          industries={taxonomies.industries}
          onTitleChange={handleTitleChange}
          onSlugChange={(slug) => updateBasics("slug", slug)}
          onClientChange={(clientId) => updateBasics("clientId", clientId)}
          onIndustryChange={(industryId) =>
            updateBasics("industryId", industryId)
          }
          onProjectDateChange={(projectDate) =>
            updateBasics("projectDate", projectDate)
          }
          onVideoEmbedChange={(url) => updateMedia("videoEmbedUrl", url)}
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
          onHeroChange={(url) => updateMedia("heroImageUrl", url)}
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
          onUpdate={(key, value) => updateStory(key, value)}
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
          onUpdate={(key, value) => updateTestimonial(key, value)}
        />
      </div>
    </div>
  );
}
