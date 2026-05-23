import { Suspense } from "react";
import { listCaseStudies } from "@/actions/case-studies";
import { CaseStudiesListPageClient } from "./case-studies-client";
import { connection } from "next/server";

export default async function Page() {
  await connection();

  const result = await listCaseStudies();

  if (!result.ok) {
    return (
      <div className="max-w-7xl p-6 md:p-10 min-w-0 w-full">
        <div className="text-sm text-destructive">{result.error.message}</div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="max-w-6xl p-6 md:p-10 min-w-0 w-full">
          <div className="h-9 w-48 animate-pulse rounded-md bg-muted" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded-md bg-muted" />
          <div className="mt-6 h-10 animate-pulse rounded-md bg-muted" />
          <div className="mt-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        </div>
      }
    >
      <CaseStudiesListPageClient
        initialStudies={result.data.studies}
        initialNextCursor={result.data.nextCursor}
      />
    </Suspense>
  );
}
