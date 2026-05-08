"use client";

import {
  MagnifyingGlassIcon,
  PencilSimpleIcon,
  PlusIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteCaseStudy, listCaseStudies } from "@/actions/case-studies";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { CaseStudyListItem } from "@/types/case-studies";

type StatusFilter = "all" | "draft" | "published" | "archived";

interface CaseStudiesListProps {
  initialData?: {
    studies: CaseStudyListItem[];
    nextCursor: string | null;
  };
}

export function CaseStudiesList({ initialData }: CaseStudiesListProps) {
  const [studies, setStudies] = useState<CaseStudyListItem[]>(
    initialData?.studies ?? [],
  );
  const [nextCursor, setNextCursor] = useState<string | null>(
    initialData?.nextCursor ?? null,
  );
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedQ, setDebouncedQ] = useState("");

  const [isLoading, startLoadTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedQ(q), 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [q]);

  const load = useCallback(
    (cursor?: string) => {
      startLoadTransition(async () => {
        const result = await listCaseStudies({
          status: filter === "all" ? undefined : filter,
          search: debouncedQ || undefined,
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
    [filter, debouncedQ],
  );

  useEffect(() => {
    if (!initialData) {
      load();
    }
  }, [load, initialData]);

  function handleDelete() {
    if (!deleteId) return;
    startDeleteTransition(async () => {
      const result = await deleteCaseStudy({ id: deleteId });
      setDeleteId(null);
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      toast.success("Deleted");

      load();
    });
  }

  return (
    <div className="max-w-6xl p-6 md:p-10">
      {}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Case Studies</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your portfolio library.
          </p>
        </div>
        <Button
          render={
            <Link href="/case-studies/new">
              <PlusIcon size={16} className="mr-2" />
              New case study
            </Link>
          }
        ></Button>
      </div>

      {}
      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative min-w-50 flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search title…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="flex gap-1 rounded-md border p-1">
          {(["all", "published", "draft", "archived"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      {}
      <div className="mt-6 grid gap-3">
        {isLoading && studies.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : studies.length === 0 ? (
          <div className="rounded-md border border-dashed py-12 text-center text-sm text-muted-foreground">
            No case studies found.
          </div>
        ) : (
          studies.map((s) => (
            <Card
              key={s.id}
              className="flex items-center justify-between gap-3 p-4"
            >
              <div className="flex min-w-0 items-center gap-4">
                {s.heroImageUrl ? (
                  <img
                    src={s.heroImageUrl}
                    alt=""
                    className="h-14 w-20 rounded object-cover"
                  />
                ) : (
                  <div className="h-14 w-20 rounded bg-muted" />
                )}
                <div className="min-w-0">
                  <div className="truncate font-semibold">{s.title}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {s.client?.name ?? "No client"} ·{" "}
                    {s.keyBusinesses.map((k) => k.name).join(", ") ||
                      "No key business"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant={s.status === "published" ? "default" : "secondary"}
                >
                  {s.status}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  render={
                    <Link href={`/case-studies/${s.id}`}>
                      <PencilSimpleIcon size={16} />
                    </Link>
                  }
                ></Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteId(s.id)}
                  disabled={isDeleting}
                >
                  <TrashIcon size={16} />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {}
      {nextCursor && (
        <div className="mt-6 flex justify-center">
          <Button
            variant="outline"
            onClick={() => load(nextCursor)}
            disabled={isLoading}
          >
            {isLoading ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}

      {}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this case
            study.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
