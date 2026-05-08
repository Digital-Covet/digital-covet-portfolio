import type { Prisma } from "@generated/prisma/client";
import type { Client } from "./client";
import type {
  IndustryWithSector,
  KeyBusinessWithIndustry,
  Taxonomy,
} from "./taxonomy";

export type { Taxonomy, IndustryWithSector, KeyBusinessWithIndustry, Client };

export type Taxonomies = {
  industries: IndustryWithSector[];
  categories: Taxonomy[];
  services: Taxonomy[];
  sectors: Taxonomy[];
  keyBusinesses: KeyBusinessWithIndustry[];
  businessModels: Taxonomy[];
  clients: Client[];
};

export type Metric = {
  label: string;
  value: string;
  unit: string | null;
};

export type Attachment = {
  name: string;
  url: string;
};

export type Basics = {
  id?: string;
  title: string;
  slug: string;
  clientId: string | null;
  sectorId: string | null;
  industryId: string | null;
  keyBusinessIds: string[];
  businessModelId: string | null;
  projectDate: string | null;
  status: "draft" | "published" | "archived";
};

export type Media = {
  heroImageUrl: string | null;
  galleryUrls: string[];
  videoEmbedUrl: string | null;
  attachments: Attachment[];
};

export type Story = {
  description: string | null;
  challenge: string | null;
  solution: string | null;
  results: string | null;
};

export type Testimonial = {
  quote: string | null;
  author: string | null;
  title: string | null;
};

export type CaseStudyForm = {
  basics: Basics;
  media: Media;
  story: Story;
  testimonial: Testimonial;
  categoryIds: string[];
  serviceIds: string[];
  metrics: Metric[];
};

export type DbCaseStudyWithRelations = Prisma.CaseStudyGetPayload<{
  include: {
    caseStudyCategories: { select: { categoryId: true } };
    caseStudyServices: { select: { serviceId: true } };
    caseStudyMetrics: { orderBy: { sortOrder: "asc" } };
    caseStudyKeyBusinesses: {
      include: {
        keyBusiness: {
          include: {
            industry: true;
          };
        };
      };
    };
    client: true;
  };
}>;

export type CaseStudyResponse = {
  study: Omit<
    DbCaseStudyWithRelations,
    "caseStudyCategories" | "caseStudyServices" | "caseStudyMetrics" | "caseStudyBusinessModels"
  >;
  categoryIds: string[];
  serviceIds: string[];
  businessModelId: string | null;
  metrics: Metric[];
};

export type CaseStudyListItem = {
  id: string;
  title: string;
  status: "draft" | "published" | "archived";
  heroImageUrl: string | null;
  client: { name: string } | null;
  keyBusinesses: { name: string; industryId: string }[];
};

export type CaseStudyListItemWithDates = CaseStudyListItem & {
  createdAt: Date;
  updatedAt: Date;
  keyBusinesses: { name: string; industryId: string }[];
  clientId: string | null;
};
