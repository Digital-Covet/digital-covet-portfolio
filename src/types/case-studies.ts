export type Taxonomy = {
  id: string;
  name: string;
};

export type Client = {
  id: string;
  name: string;
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

export type Testimonial = {
  quote: string | null;
  author: string | null;
  title: string | null;
};

export type Story = {
  description: string | null;
  challenge: string | null;
  solution: string | null;
  results: string | null;
};

export type Media = {
  heroImageUrl: string | null;
  galleryUrls: string[];
  videoEmbedUrl: string | null;
  attachments: Attachment[];
};

export type Basics = {
  id?: string;
  title: string;
  slug: string;
  clientId: string | null;
  industryId: string | null;
  projectDate: string | null;
  status: "draft" | "published" | "archived";
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

export type Taxonomies = {
  industries: Taxonomy[];
  categories: Taxonomy[];
  services: Taxonomy[];
  clients: Client[];
};

export type CaseStudyListItem = {
  id: string;
  title: string;
  status: "draft" | "published" | "archived";
  heroImageUrl: string | null;
  client: { name: string } | null;
  industry: { name: string } | null;
};

export type DbCaseStudy = {
  id: string;
  title: string;
  slug: string;
  clientId: string | null;
  industryId: string | null;
  projectDate: Date | null;
  heroImageUrl: string | null;
  galleryUrls: string[];
  videoEmbedUrl: string | null;
  attachmentUrls: unknown | null;
  description: string | null;
  challenge: string | null;
  solution: string | null;
  results: string | null;
  testimonialQuote: string | null;
  testimonialAuthor: string | null;
  testimonialTitle: string | null;
  status: "draft" | "published" | "archived";
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
};

export type CaseStudyResponse = {
  study: DbCaseStudy;
  category_ids: string[];
  service_ids: string[];
  metrics: Metric[];
};
