import type {
  Attachment,
  CaseStudyForm,
  CaseStudyResponse,
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

export function mapDbToForm(db: CaseStudyResponse): CaseStudyForm {
  const { study } = db;
  return {
    basics: {
      id: study.id,
      title: study.title,
      slug: study.slug,
      clientId: study.clientId,
      industryId: study.industryId,
      projectDate: study.projectDate?.toISOString().split("T")[0] ?? null,
      status: study.status,
    },
    media: {
      heroImageUrl: study.heroImageUrl,
      galleryUrls: study.galleryUrls ?? [],
      videoEmbedUrl: study.videoEmbedUrl,
      attachments: (study.attachmentUrls as Attachment[]) ?? [],
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
    categoryIds: db.category_ids,
    serviceIds: db.service_ids,
    metrics: db.metrics,
  };
}

export function createEmptyForm(): CaseStudyForm {
  return {
    basics: {
      title: "",
      slug: "",
      clientId: null,
      industryId: null,
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

export function mapFormToPayload(form: CaseStudyForm) {
  return {
    id: form.basics.id,
    title: form.basics.title.trim(),
    slug: form.basics.slug,
    client_id: form.basics.clientId,
    industry_id: form.basics.industryId,
    project_date: form.basics.projectDate,
    hero_image_url: form.media.heroImageUrl,
    gallery_urls: form.media.galleryUrls,
    video_embed_url: form.media.videoEmbedUrl,
    attachments: form.media.attachments,
    description: form.story.description,
    challenge: form.story.challenge,
    solution: form.story.solution,
    results: form.story.results,
    testimonial_quote: form.testimonial.quote,
    testimonial_author: form.testimonial.author,
    testimonial_title: form.testimonial.title,
    status: form.basics.status,
    category_ids: form.categoryIds,
    service_ids: form.serviceIds,
    metrics: form.metrics.filter((m) => m.label && m.value),
  };
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
