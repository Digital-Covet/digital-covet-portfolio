import { z } from "zod";

import { attachmentSchema } from "@/schemas/content";
import type {
  CaseStudyForm,
  CaseStudyResponse,
  Metric,
} from "@/types/case-studies";

export function updateAtIndex<T>(
  arr: T[],
  index: number,
  updater: (item: T) => T,
): T[] {
  return arr.map((item, i) => (i === index ? updater(item) : item));
}

export function removeAtIndex<T>(arr: T[], index: number): T[] {
  return arr.filter((_, i) => i !== index);
}

export function appendItem<T>(arr: T[], item: T): T[] {
  return [...arr, item];
}

export function toggleInArray(arr: string[], id: string): string[] {
  return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function createEmptyForm(): CaseStudyForm {
  return {
    basics: {
      title: "",
      slug: "",
      clientId: null,
      sectorId: null,
      industryId: null,
      keyBusinessIds: [],
      businessModelIds: [],
      projectDate: null,
      status: "draft",
    },
    media: {
      heroImageUrl: null,
      galleryUrls: [],
      videoEmbedUrl: null,
      attachments: [],
    },
    story: {
      description: null,
      challenge: null,
      solution: null,
      results: null,
    },
    testimonial: {
      quote: null,
      author: null,
      title: null,
    },
    categoryIds: [],
    serviceIds: [],
    metrics: [],
  };
}

export function mapDbToForm(db: CaseStudyResponse): CaseStudyForm {
  const { study } = db;

  const parsedAttachments = z
    .array(attachmentSchema)
    .safeParse(study.attachmentUrls);

  return {
    basics: {
      id: study.id,
      title: study.title,
      slug: study.slug,
      clientId: study.clientId,
      sectorId:
        study.caseStudyKeyBusinesses[0]?.keyBusiness?.industry?.sectorId ??
        null,
      industryId:
        study.caseStudyKeyBusinesses[0]?.keyBusiness?.industryId ?? null,
      keyBusinessIds: study.caseStudyKeyBusinesses.map((k) => k.keyBusinessId),
      businessModelIds: db.businessModelIds,

      projectDate: study.projectDate
        ? study.projectDate.toISOString().split("T")[0]!
        : null,
      status: study.status as "draft" | "published" | "archived",
    },
    media: {
      heroImageUrl: study.heroImageUrl,
      galleryUrls: study.galleryUrls ?? [],
      videoEmbedUrl: study.videoEmbedUrl,
      attachments: parsedAttachments.success ? parsedAttachments.data : [],
    },
    story: {
      description: study.description,
      challenge: study.challenge,
      solution: study.solution,
      results: study.results,
    },
    testimonial: {
      quote: study.testimonialQuote,
      author: study.testimonialAuthor,
      title: study.testimonialTitle,
    },

    categoryIds: db.categoryIds,
    serviceIds: db.serviceIds,
    metrics: db.metrics,
  };
}

export function buildSavePayload(form: CaseStudyForm) {
  return {
    id: form.basics.id,
    title: form.basics.title.trim(),

    slug: form.basics.slug || slugify(form.basics.title),
    clientId: form.basics.clientId,
    keyBusinessIds: form.basics.keyBusinessIds,
    businessModelIds: form.basics.businessModelIds,
    projectDate: form.basics.projectDate,
    heroImageUrl: form.media.heroImageUrl,
    galleryUrls: form.media.galleryUrls,
    videoEmbedUrl: form.media.videoEmbedUrl,
    attachments: form.media.attachments,
    description: form.story.description,
    challenge: form.story.challenge,
    solution: form.story.solution,
    results: form.story.results,
    testimonialQuote: form.testimonial.quote,
    testimonialAuthor: form.testimonial.author,
    testimonialTitle: form.testimonial.title,
    status: form.basics.status,
    categoryIds: form.categoryIds,
    serviceIds: form.serviceIds,

    metrics: form.metrics.filter((m): m is Metric =>
      Boolean(m.label && m.value),
    ),
  } satisfies Parameters<
    typeof import("@/actions/case-studies").upsertCaseStudy
  >[0];
}
