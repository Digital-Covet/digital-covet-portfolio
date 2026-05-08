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

import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CaseStudyListItem } from "@/types/case-studies";

type StatusFilter = "all" | "draft" | "published" | "archived";

export default function CaseStudiesListPage() {
  const [studies, setStudies] = useState<CaseStudyListItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
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
    load();
  }, [load]);

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

        <div className="flex gap-1 border p-1">
          {(["all", "published", "draft", "archived"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs font-medium capitalize transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {}
      <Table className="mt-6">
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Key Businesses</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && studies.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center py-12 text-muted-foreground"
              >
                Loading…
              </TableCell>
            </TableRow>
          ) : studies.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center py-12 text-muted-foreground"
              >
                No case studies found.
              </TableCell>
            </TableRow>
          ) : (
            studies.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.title}</TableCell>
                <TableCell>{s.client?.name ?? "No client"}</TableCell>
                <TableCell>
                  {s.keyBusinesses.map((k) => k.name).join(", ") ||
                    "No key business"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={s.status === "published" ? "default" : "secondary"}
                  >
                    {s.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      render={
                        <Link href={`/case-studies/${s.id}`}>
                          <PencilSimpleIcon size={16} />
                        </Link>
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(s.id)}
                      disabled={isDeleting}
                    >
                      <TrashIcon size={16} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

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
