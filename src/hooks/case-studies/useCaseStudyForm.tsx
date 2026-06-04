"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import { deleteMediaFile, upsertCaseStudy } from "@/actions/case-studies";
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
} from "@/utils/case-studies/case-studies";
import { useDirtyTracking } from "./useDirtyTracking";

interface UseCaseStudyFormOptions {
  id: string;
  initialData: CaseStudyResponse | null;
  taxonomies: Taxonomies;
}

const AUTOSAVE_INTERVAL_MS = 30000;

export function useCaseStudyForm({
  id,
  initialData,
  taxonomies,
}: UseCaseStudyFormOptions) {
  const router = useRouter();
  const isNew = id === "new";

  const [resolvedId, setResolvedId] = useState<string | null>(null);
  const effectiveId = resolvedId || id;
  const effectiveIsNew = !resolvedId && isNew;

  const [form, setForm] = useState<CaseStudyForm>(() =>
    initialData ? mapDbToForm(initialData) : createEmptyForm(),
  );

  const formRef = useRef(form);
  formRef.current = form;

  const dirtyTracker = useDirtyTracking<CaseStudyForm>();
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isPending, startTransition] = useTransition();

  const performAutosave = useCallback(() => {
    const currentForm = formRef.current;
    if (!currentForm.basics.title.trim()) return;

    if (!dirtyTracker.isDirty(currentForm)) {
      console.log("[Autosave] No changes detected, skipping save");
      return;
    }

    console.log("[Autosave] Changes detected, saving...");
    startTransition(async () => {
      const payload = buildSavePayload(currentForm);
      const result = await upsertCaseStudy(payload);

      if (!result.ok) {
        toast.error("Autosave failed: " + result.error.message);
        return;
      }

      const now = new Date();
      setLastSavedAt(now);
      dirtyTracker.markClean(currentForm);

      if (isNew) {
        setResolvedId(result.data.id);
        router.push(`/case-studies/${result.data.id}`);
      }
    });
  }, [isNew, router, dirtyTracker]);

  useEffect(() => {
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(
      performAutosave,
      AUTOSAVE_INTERVAL_MS,
    );

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [performAutosave]);

  // ✅ FIX: Sync ref immediately in all state updates
  const updateBasics = useCallback(
    <K extends keyof CaseStudyForm["basics"]>(
      key: K,
      value: CaseStudyForm["basics"][K],
    ) => {
      setForm((prev) => {
        const next = {
          ...prev,
          basics: { ...prev.basics, [key]: value },
        };
        formRef.current = next; // ← Sync ref before returning
        return next;
      });
    },
    [],
  );

  const removeHeroImage = useCallback(async () => {
    const currentUrl = formRef.current.media.heroImageUrl;
    if (currentUrl) {
      const result = await deleteMediaFile({ url: currentUrl });
      if (!result.ok) {
        toast.error("Failed to delete hero image: " + result.error.message);
        return;
      }
    }
    setForm((prev) => {
      const next = {
        ...prev,
        media: { ...prev.media, heroImageUrl: null },
      };
      formRef.current = next; // ← Sync ref
      return next;
    });
  }, []);

  const updateMedia = useCallback(
    <K extends keyof CaseStudyForm["media"]>(
      key: K,
      value: CaseStudyForm["media"][K],
    ) => {
      setForm((prev) => {
        const next = {
          ...prev,
          media: { ...prev.media, [key]: value },
        };
        formRef.current = next; // ← Sync ref
        return next;
      });
    },
    [],
  );

  const updateStory = useCallback(
    <K extends keyof CaseStudyForm["story"]>(
      key: K,
      value: CaseStudyForm["story"][K],
    ) => {
      setForm((prev) => {
        const next = {
          ...prev,
          story: { ...prev.story, [key]: value },
        };
        formRef.current = next; // ← Sync ref
        return next;
      });
    },
    [],
  );

  const updateTestimonial = useCallback(
    <K extends keyof CaseStudyForm["testimonial"]>(
      key: K,
      value: CaseStudyForm["testimonial"][K],
    ) => {
      setForm((prev) => {
        const next = {
          ...prev,
          testimonial: { ...prev.testimonial, [key]: value },
        };
        formRef.current = next; // ← Sync ref
        return next;
      });
    },
    [],
  );

  const toggleCategory = useCallback((categoryId: string) => {
    setForm((prev) => {
      const next = {
        ...prev,
        categoryIds: toggleInArray(prev.categoryIds, categoryId),
      };
      formRef.current = next; // ← Sync ref
      return next;
    });
  }, []);

  const toggleService = useCallback((serviceId: string) => {
    setForm((prev) => {
      const next = {
        ...prev,
        serviceIds: toggleInArray(prev.serviceIds, serviceId),
      };
      formRef.current = next; // ← Sync ref
      return next;
    });
  }, []);

  const addMetric = useCallback(() => {
    setForm((prev) => {
      const next = {
        ...prev,
        metrics: appendItem(prev.metrics, { label: "", value: "", unit: null }),
      };
      formRef.current = next; // ← Sync ref
      return next;
    });
  }, []);

  const updateMetric = useCallback(
    (index: number, updates: Partial<Metric>) => {
      setForm((prev) => {
        const next = {
          ...prev,
          metrics: updateAtIndex(prev.metrics, index, (m) => ({
            ...m,
            ...updates,
          })),
        };
        formRef.current = next; // ← Sync ref
        return next;
      });
    },
    [],
  );

  const removeMetric = useCallback((index: number) => {
    setForm((prev) => {
      const next = {
        ...prev,
        metrics: removeAtIndex(prev.metrics, index),
      };
      formRef.current = next; // ← Sync ref
      return next;
    });
  }, []);

  const addGalleryImage = useCallback((url: string) => {
    setForm((prev) => {
      const next = {
        ...prev,
        media: {
          ...prev.media,
          galleryUrls: appendItem(prev.media.galleryUrls, url),
        },
      };
      formRef.current = next; // ← Sync ref
      return next;
    });
  }, []);

  const removeGalleryImage = useCallback(async (index: number) => {
    const url = formRef.current.media.galleryUrls[index];
    if (url) {
      const result = await deleteMediaFile({ url });
      if (!result.ok) {
        toast.error("Failed to delete image: " + result.error.message);
        return;
      }
    }
    setForm((prev) => {
      const next = {
        ...prev,
        media: {
          ...prev.media,
          galleryUrls: removeAtIndex(prev.media.galleryUrls, index),
        },
      };
      formRef.current = next; // ← Sync ref
      return next;
    });
  }, []);

  const addAttachment = useCallback((attachment: Attachment) => {
    setForm((prev) => {
      const next = {
        ...prev,
        media: {
          ...prev.media,
          attachments: appendItem(prev.media.attachments, attachment),
        },
      };
      formRef.current = next; // ← Sync ref
      return next;
    });
  }, []);

  const removeAttachment = useCallback(async (index: number) => {
    const attachment = formRef.current.media.attachments[index];
    if (attachment?.url) {
      const result = await deleteMediaFile({ url: attachment.url });
      if (!result.ok) {
        toast.error("Failed to delete attachment: " + result.error.message);
        return;
      }
    }
    setForm((prev) => {
      const next = {
        ...prev,
        media: {
          ...prev.media,
          attachments: removeAtIndex(prev.media.attachments, index),
        },
      };
      formRef.current = next; // ← Sync ref
      return next;
    });
  }, []);

  const handleTitleChange = useCallback(
    (title: string) => {
      setForm((prev) => {
        const newSlug =
          isNew || !prev.basics.slug ? slugify(title) : prev.basics.slug;
        const next = {
          ...prev,
          basics: { ...prev.basics, title, slug: newSlug },
        };
        formRef.current = next; // ← Sync ref
        return next;
      });
    },
    [isNew],
  );

  const save = useCallback(() => {
    const currentForm = formRef.current;
    if (!currentForm.basics.title.trim()) {
      toast.error("Title is required");
      return Promise.resolve({
        ok: false as const,
        error: new Error("Title is required"),
      });
    }

    return new Promise<{ ok: boolean; id?: string; error?: Error }>(
      (resolve) => {
        startTransition(async () => {
          const payload = buildSavePayload(currentForm);
          const result = await upsertCaseStudy(payload);

          if (!result.ok) {
            toast.error(result.error.message);
            resolve({ ok: false, error: new Error(result.error.message) });
            return;
          }

          toast.success("Saved successfully");
          const now = new Date();
          setLastSavedAt(now);
          dirtyTracker.markClean(currentForm);

          if (isNew) {
            setResolvedId(result.data.id);
            router.push(`/case-studies/${result.data.id}`);
          }

          resolve({ ok: true, id: result.data.id });
        });
      },
    );
  }, [isNew, router, dirtyTracker]);

  const saveAndReturnId = useCallback(() => {
    const currentForm = formRef.current;
    if (!currentForm.basics.title.trim()) {
      toast.error("Title is required before uploading media");
      return Promise.resolve({ ok: false as const, id: undefined });
    }

    return new Promise<{ ok: boolean; id?: string }>((resolve) => {
      startTransition(async () => {
        const payload = buildSavePayload(currentForm);
        const result = await upsertCaseStudy(payload);

        if (!result.ok) {
          toast.error("Failed to save before upload: " + result.error.message);
          resolve({ ok: false, id: undefined });
          return;
        }

        const now = new Date();
        setLastSavedAt(now);
        dirtyTracker.markClean(currentForm);

        if (isNew) {
          setResolvedId(result.data.id);
          router.replace(`/case-studies/${result.data.id}`, { scroll: false });
        }

        resolve({ ok: true, id: result.data.id });
      });
    });
  }, [isNew, router, dirtyTracker]);

  const basicsHandlers = useMemo(
    () => ({
      onTitleChange: handleTitleChange,
      onSlugChange: (slug: string) => updateBasics("slug", slug),
      onClientChange: (id: string | null) => updateBasics("clientId", id),
      onSectorChange: (id: string | null) => updateBasics("sectorId", id),
      onIndustryChange: (id: string | null) => updateBasics("industryId", id),
      onKeyBusinessIdsChange: (ids: string[]) =>
        updateBasics("keyBusinessIds", ids),
      onBusinessModelIdsChange: (ids: string[]) =>
        updateBasics("businessModelIds", ids),
      onProjectDateChange: (date: string | null) =>
        updateBasics("projectDate", date),
      onStatusChange: (status: "draft" | "published" | "archived") =>
        updateBasics("status", status),
    }),
    [updateBasics, handleTitleChange],
  );

  const mediaHandlers = useMemo(
    () => ({
      onHeroChange: async (url: string | null) => {
        if (url === null) {
          removeHeroImage();
        } else {
          const currentUrl = formRef.current.media.heroImageUrl;
          if (currentUrl) {
            await deleteMediaFile({ url: currentUrl });
          }
          updateMedia("heroImageUrl", url);
        }
      },
      onVideoEmbedChange: (url: string | null) =>
        updateMedia("videoEmbedUrl", url),
    }),
    [updateMedia, removeHeroImage],
  );

  return {
    form,
    taxonomies,
    saving: isPending,
    lastSavedAt,
    isNew: effectiveIsNew,
    resolvedId,
    isDirty: dirtyTracker.isDirty(form),
    updateStory,
    updateTestimonial,
    toggleCategory,
    toggleService,
    addMetric,
    updateMetric,
    removeMetric,
    removeHeroImage,
    addGalleryImage,
    removeGalleryImage,
    addAttachment,
    removeAttachment,
    save,
    saveAndReturnId,
    basicsHandlers,
    mediaHandlers,
  };
}
