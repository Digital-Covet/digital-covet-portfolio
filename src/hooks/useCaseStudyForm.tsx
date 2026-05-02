"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getCaseStudy,
  listTaxonomies,
  upsertCaseStudy,
} from "@/actions/content";
import type {
  Attachment,
  CaseStudyForm,
  Metric,
  Taxonomies,
} from "@/types/case-studies";
import {
  appendItem,
  createEmptyForm,
  mapDbToForm,
  mapFormToPayload,
  removeAtIndex,
  slugify,
  toggleInArray,
  updateAtIndex,
} from "@/utils/case-studies";

export function useCaseStudyForm(id: string) {
  const router = useRouter();
  const isNew = id === "new";
  const [form, setForm] = useState<CaseStudyForm>(createEmptyForm);
  const [taxonomies, setTaxonomies] = useState<Taxonomies>({
    industries: [],
    categories: [],
    services: [],
    clients: [],
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    listTaxonomies().then(setTaxonomies);
    if (!isNew) {
      getCaseStudy({ id })
        .then((r) => {
          setForm(mapDbToForm(r));
          setLoading(false);
        })
        .catch(() => {
          toast.error("Not found");
          router.push("/case-studies");
        });
    }
  }, [id, isNew, router]);

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

  const removeGalleryImage = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      media: {
        ...prev.media,
        galleryUrls: removeAtIndex(prev.media.galleryUrls, index),
      },
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
          !prev.basics.slug || isNew ? slugify(title) : prev.basics.slug;
        return { ...prev, basics: { ...prev.basics, title, slug: newSlug } };
      });
    },
    [isNew],
  );

  const save = useCallback(async () => {
    if (!form.basics.title.trim()) {
      toast.error("Title required");
      return;
    }
    const slug = form.basics.slug || slugify(form.basics.title);
    setSaving(true);
    try {
      const payload = mapFormToPayload({
        ...form,
        basics: { ...form.basics, slug },
      });
      const res = await upsertCaseStudy(payload);
      toast.success("Saved");
      if (isNew) {
        router.push(`/case-studies/${res.id}`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }, [form, isNew, router]);

  return {
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
  };
}
