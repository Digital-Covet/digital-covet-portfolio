import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteCaseStudy, listCaseStudies } from "@/actions/case-studies";
import type { CaseStudyListItem } from "@/types/case-studies";

type StatusFilter = "all" | "draft" | "published" | "archived";

const DEBOUNCE_DELAY_MS = 300;

export type CaseStudiesListViewModel = {
  // Data
  studies: CaseStudyListItem[];
  nextCursor: string | null;

  // Filters
  searchQuery: string;
  statusFilter: StatusFilter;

  // UI State
  isLoading: boolean;
  isDeleting: boolean;
  deleteTargetId: string | null;

  // Actions
  setSearchQuery: (query: string) => void;
  setStatusFilter: (filter: StatusFilter) => void;
  loadMore: () => void;
  refresh: () => void;
  initiateDelete: (id: string) => void;
  confirmDelete: () => void;
  cancelDelete: () => void;
};

export function useCaseStudiesList(): CaseStudiesListViewModel {
  const [studies, setStudies] = useState<CaseStudyListItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [debouncedQuery, setDebouncedQuery] = useState("");
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isLoading, startLoadTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  // Debounce search query
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(
      () => setDebouncedQuery(searchQuery),
      DEBOUNCE_DELAY_MS,
    );
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery]);

  // Load case studies
  const load = useCallback(
    (cursor?: string) => {
      startLoadTransition(async () => {
        const result = await listCaseStudies({
          status: statusFilter === "all" ? undefined : statusFilter,
          search: debouncedQuery || undefined,
          cursor,
        });

        if (!result.ok) {
          toast.error(result.error.message);
          return;
        }

        setStudies((prev) =>
          cursor ? [...prev, ...result.data.studies] : result.data.studies,
        );
        setNextCursor(result.data.nextCursor);
      });
    },
    [statusFilter, debouncedQuery],
  );

  // Initial load + refresh on filter changes
  useEffect(() => {
    load();
  }, [load]);

  // Delete handler
  const confirmDelete = useCallback(() => {
    if (!deleteTargetId) return;

    const idToDelete = deleteTargetId;
    setDeleteTargetId(null);

    startDeleteTransition(async () => {
      const result = await deleteCaseStudy({ id: idToDelete });

      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }

      toast.success("Case study deleted successfully");
      load(); // Refresh list
    });
  }, [deleteTargetId, load]);

  return {
    // Data
    studies,
    nextCursor,

    // Filters
    searchQuery,
    statusFilter,

    // UI State
    isLoading,
    isDeleting,
    deleteTargetId,

    // Actions
    setSearchQuery,
    setStatusFilter,
    loadMore: () => nextCursor && load(nextCursor),
    refresh: () => load(),
    initiateDelete: setDeleteTargetId,
    confirmDelete,
    cancelDelete: () => setDeleteTargetId(null),
  };
}
