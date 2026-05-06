import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getCaseStudy, listTaxonomies } from "@/actions/content";
import { CaseStudyEditorShell } from "@/components/case-studies/editor-shell";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CaseStudyEditorPage({ params }: Props) {
  const { id } = await params;
  const isNew = id === "new";

  const [taxonomiesResult, studyResult] = await Promise.all([
    listTaxonomies(),
    isNew ? Promise.resolve(null) : getCaseStudy({ id }),
  ]);

  if (!taxonomiesResult.ok) {
    throw new Error(taxonomiesResult.error.message);
  }

  if (!isNew && (!studyResult || !studyResult.ok)) {
    notFound();
  }

  const initialData = studyResult?.ok ? studyResult.data : null;

  return (
    <div className="p-6 md:p-10">
      <Link
        href="/case-studies"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon size={16} className="mr-1" />
        Back
      </Link>

      {}
      <CaseStudyEditorShell
        id={id}
        initialData={initialData}
        taxonomies={taxonomiesResult.data}
      />
    </div>
  );
}
