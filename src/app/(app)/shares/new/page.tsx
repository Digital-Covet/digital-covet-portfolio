import { redirect } from "next/navigation";
import { listCaseStudies, listTaxonomies } from "@/actions/content";
import { NewShareForm } from "@/components/shares/new-share-form";

export default async function NewSharePage() {
  let taxonomies: Awaited<ReturnType<typeof listTaxonomies>>;
  let caseStudiesData: Awaited<ReturnType<typeof listCaseStudies>>;

try {
    [taxonomies, caseStudiesData] = await Promise.all([
      listTaxonomies(),
      listCaseStudies(),
    ]);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      redirect("/login");
    }
    throw error;
  }

  if (!caseStudiesData.ok || !taxonomies.ok) {
    redirect("/login");
  }

  const publishedStudies = caseStudiesData.data.studies.filter(
    (s) => s.status === "published",
  );

  return <NewShareForm taxonomies={taxonomies.data} studies={publishedStudies} />;
}
