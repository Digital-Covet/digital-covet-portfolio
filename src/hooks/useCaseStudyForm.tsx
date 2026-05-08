"use client";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { upsertCaseStudy } from "@/actions/case-studies";
import type {
  Attachment,
  CaseStudyForm,
  CaseStudyResponse,
  Metric,
  Taxonomies,
} from "@/types/case-studies";
import {
  appendItem,
  buildSavePayload,
  createEmptyForm,
  mapDbToForm,
  removeAtIndex,
  slugify,
  toggleInArray,
  updateAtIndex,
} from "@/utils/case-studies";

interface UseCaseStudyFormOptions {
  id: string;
  initialData: CaseStudyResponse | null;
  taxonomies: Taxonomies;
}

export function useCaseStudyForm({
  id,
  initialData,
  taxonomies,
}: UseCaseStudyFormOptions) {
  const router = useRouter();
  const isNew = id === "new";

  const [form, setForm] = useState<CaseStudyForm>(() =>
    initialData ? mapDbToForm(initialData) : createEmptyForm(),
  );

  // Ref to always access current form state without subscribing to changes
  const formRef = useRef(form);
  formRef.current = form;

  const [isPending, startTransition] = useTransition();

  const updateBasics = useCallback(
    <K extends keyof CaseStudyForm["basics"]>(
      key: K,
      value: CaseStudyForm["basics"][K],
    ) => {
      setForm((prev) => ({
        ...prev,
        basics: { ...prev.basics, [key]: value },
      }));
    },
    [],
  );

  const updateMedia = useCallback(
    <K extends keyof CaseStudyForm["media"]>(
      key: K,
      value: CaseStudyForm["media"][K],
    ) => {
      setForm((prev) => ({
        ...prev,
        media: { ...prev.media, [key]: value },
      }));
    },
    [],
  );

  const updateStory = useCallback(
    <K extends keyof CaseStudyForm["story"]>(
      key: K,
      value: CaseStudyForm["story"][K],
    ) => {
      setForm((prev) => ({
        ...prev,
        story: { ...prev.story, [key]: value },
      }));
    },
    [],
  );

  const updateTestimonial = useCallback(
    <K extends keyof CaseStudyForm["testimonial"]>(
      key: K,
      value: CaseStudyForm["testimonial"][K],
    ) => {
      setForm((prev) => ({
        ...prev,
        testimonial: { ...prev.testimonial, [key]: value },
      }));
    },
    [],
  );

  const toggleCategory = useCallback((categoryId: string) => {
    setForm((prev) => ({
      ...prev,
      categoryIds: toggleInArray(prev.categoryIds, categoryId),
    }));
  }, []);

  const toggleService = useCallback((serviceId: string) => {
    setForm((prev) => ({
      ...prev,
      serviceIds: toggleInArray(prev.serviceIds, serviceId),
    }));
  }, []);

  const addMetric = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      metrics: appendItem(prev.metrics, { label: "", value: "", unit: null }),
    }));
  }, []);

  const updateMetric = useCallback(
    (index: number, updates: Partial<Metric>) => {
      setForm((prev) => ({
        ...prev,
        metrics: updateAtIndex(prev.metrics, index, (m) => ({
          ...m,
          ...updates,
        })),
      }));
    },
    [],
  );

  const removeMetric = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      metrics: removeAtIndex(prev.metrics, index),
    }));
  }, []);

  const addGalleryImage = useCallback((url: string) => {
    setForm((prev) => ({
      ...prev,
      media: {
        ...prev.media,
        galleryUrls: appendItem(prev.media.galleryUrls, url),
      },
    }));
  }, []);

  const removeGalleryImage = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      media: {
        ...prev.media,
        galleryUrls: removeAtIndex(prev.media.galleryUrls, index),
      },
    }));
  }, []);

  const addAttachment = useCallback((attachment: Attachment) => {
    setForm((prev) => ({
      ...prev,
      media: {
        ...prev.media,
        attachments: appendItem(prev.media.attachments, attachment),
      },
    }));
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      media: {
        ...prev.media,
        attachments: removeAtIndex(prev.media.attachments, index),
      },
    }));
  }, []);

  const handleTitleChange = useCallback(
    (title: string) => {
      setForm((prev) => {
        const newSlug =
          isNew || !prev.basics.slug ? slugify(title) : prev.basics.slug;
        return { ...prev, basics: { ...prev.basics, title, slug: newSlug } };
      });
    },
    [isNew],
  );

  // FIXED: Uses formRef instead of `form` in deps — callback is now stable
  const save = useCallback(() => {
    const currentForm = formRef.current;
    if (!currentForm.basics.title.trim()) {
      toast.error("Title is required");
      return;
    }
    startTransition(async () => {
      const payload = buildSavePayload(currentForm);
      const result = await upsertCaseStudy(payload);
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      toast.success("Saved");
      if (isNew) {
        router.push(`/case-studies/${result.data.id}`);
      }
    });
  }, [isNew, router]);

  // FIXED: Stabilized callback wrappers so section components don't re-render
  // on unrelated state changes.
  const basicsHandlers = useMemo(
    () => ({
      onTitleChange: handleTitleChange,
      onSlugChange: (slug: string) => updateBasics("slug", slug),
      onClientChange: (id: string | null) => updateBasics("clientId", id),
      onSectorChange: (id: string | null) => updateBasics("sectorId", id),
      onIndustryChange: (id: string | null) => updateBasics("industryId", id),
      onKeyBusinessIdsChange: (ids: string[]) =>
        updateBasics("keyBusinessIds", ids),
      onBusinessModelIdChange: (id: string | null) =>
        updateBasics("businessModelId", id),
      onProjectDateChange: (date: string | null) =>
        updateBasics("projectDate", date),
      onStatusChange: (status: "draft" | "published" | "archived") =>
        updateBasics("status", status),
    }),
    [updateBasics, handleTitleChange],
  );

  const mediaHandlers = useMemo(
    () => ({
      onHeroChange: (url: string | null) => updateMedia("heroImageUrl", url),
      onVideoEmbedChange: (url: string | null) =>
        updateMedia("videoEmbedUrl", url),
    }),
    [updateMedia],
  );

  return {
    form,
    taxonomies,
    saving: isPending,
    isNew,
    updateStory,
    updateTestimonial,
    toggleCategory,
    toggleService,
    addMetric,
    updateMetric,
    removeMetric,
    addGalleryImage,
    removeGalleryImage,
    addAttachment,
    removeAttachment,
    save,
    basicsHandlers,
    mediaHandlers,
  };
}
