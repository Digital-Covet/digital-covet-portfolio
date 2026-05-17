import { z } from "zod";
import { attachmentSchema } from "@/schemas/content";
import type { CaseStudyForm, CaseStudyResponse } from "@/types/case-studies";

/**
 * Safely extracts the primary sector from a case study's key businesses.
 * Returns the sector if all key businesses share the same sector, otherwise returns null.
 */
function extractPrimarySectorId(
  keyBusinesses: Array<{
    keyBusiness: {
      industryId: string | null;
      industry?: { sectorId: string | null } | null;
    };
  }>,
): string | null {
  if (keyBusinesses.length === 0) return null;

  const sectors = keyBusinesses
    .map((kb) => kb.keyBusiness.industry?.sectorId)
    .filter((id): id is string => id !== null && id !== undefined);

  if (sectors.length === 0) return null;

  // ✅ Validate consistency: all key businesses should share the same sector
  const uniqueSectors = [...new Set(sectors)];
  if (uniqueSectors.length > 1) {
    console.warn(
      `[mapDbToForm] Case study has key businesses from multiple sectors: ${uniqueSectors.join(", ")}. Using first sector.`,
    );
  }

  return uniqueSectors[0] ?? null;
}

/**
 * Safely extracts the primary industry from a case study's key businesses.
 * Returns the industry if all key businesses share the same industry, otherwise returns null.
 */
function extractPrimaryIndustryId(
  keyBusinesses: Array<{ keyBusiness: { industryId: string | null } }>,
): string | null {
  if (keyBusinesses.length === 0) return null;

  const industries = keyBusinesses
    .map((kb) => kb.keyBusiness.industryId)
    .filter((id): id is string => id !== null);
  const uniqueIndustries = [...new Set(industries)];

  if (uniqueIndustries.length > 1) {
    console.warn(
      `[mapDbToForm] Case study has key businesses from multiple industries: ${uniqueIndustries.join(", ")}. Using first industry.`,
    );
  }

  return uniqueIndustries[0] ?? null;
}

/**
 * ✅ REFACTORED: Type-safe mapping from database model to form state.
 *
 * Handles edge cases:
 * - Multiple key businesses with different industries/sectors
 * - Missing or malformed attachments
 * - Null date values
 */
export function mapDbToForm(db: CaseStudyResponse): CaseStudyForm {
  const { study } = db;

  // ✅ Safe attachment parsing with validation
  const parsedAttachments = z
    .array(attachmentSchema)
    .safeParse(study.attachmentUrls);

  if (!parsedAttachments.success) {
    console.warn(
      `[mapDbToForm] Invalid attachments for case study ${study.id}:`,
      parsedAttachments.error,
    );
  }

  // ✅ Safe extraction of sector and industry
  const sectorId = extractPrimarySectorId(study.caseStudyKeyBusinesses);
  const industryId = extractPrimaryIndustryId(study.caseStudyKeyBusinesses);

  return {
    basics: {
      id: study.id,
      title: study.title,
      slug: study.slug,
      clientId: study.clientId,
      sectorId,
      industryId,
      keyBusinessIds: study.caseStudyKeyBusinesses.map(
        (kb) => kb.keyBusinessId,
      ),
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
