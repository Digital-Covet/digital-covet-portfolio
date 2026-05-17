"use client";

import {
  MagnifyingGlassIcon,
  PencilSimpleIcon,
  PlusIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
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
import { useCaseStudiesList } from "@/hooks/case-studies/useCaseStudiesList";

const STATUS_FILTERS = ["all", "published", "draft", "archived"] as const;

export function CaseStudiesList() {
  const vm = useCaseStudiesList(); // ✅ Reuse same hook

  return (
    <div className="max-w-6xl p-6 md:p-10">
      {/* Header */}
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
        />
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative min-w-50 flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search title…"
            value={vm.searchQuery}
            onChange={(e) => vm.setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-1 border p-1">
          {STATUS_FILTERS.map((filter) => (
            <Button
              key={filter}
              variant={vm.statusFilter === filter ? "default" : "ghost"}
              size="sm"
              onClick={() => vm.setStatusFilter(filter)}
            >
              {filter}
            </Button>
          ))}
        </div>
      </div>

      {/* Card Grid */}
      <div className="mt-6 grid gap-3">
        {vm.isLoading && vm.studies.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : vm.studies.length === 0 ? (
          <div className="border border-dashed py-12 text-center text-sm text-muted-foreground rounded">
            No case studies found.
          </div>
        ) : (
          vm.studies.map((study) => (
            <Card
              key={study.id}
              className="flex items-center justify-between gap-3 p-4"
            >
              <div className="flex min-w-0 items-center gap-4">
                {study.heroImageUrl ? (
                  <img
                    src={study.heroImageUrl}
                    alt=""
                    className="h-14 w-20 rounded object-cover"
                  />
                ) : (
                  <div className="h-14 w-20 rounded bg-muted" />
                )}
                <div className="min-w-0">
                  <div className="truncate font-semibold">{study.title}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {study.client?.name ?? "No client"} ·{" "}
                    {study.keyBusinesses.map((k) => k.name).join(", ") ||
                      "No key business"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    study.status === "published" ? "default" : "secondary"
                  }
                >
                  {study.status}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  render={
                    <Link href={`/case-studies/${study.id}`}>
                      <PencilSimpleIcon size={16} />
                    </Link>
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => vm.initiateDelete(study.id)}
                  disabled={vm.isDeleting}
                >
                  <TrashIcon size={16} />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Load More */}
      {vm.nextCursor && (
        <div className="mt-6 flex justify-center">
          <Button
            variant="outline"
            onClick={vm.loadMore}
            disabled={vm.isLoading}
          >
            {vm.isLoading ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!vm.deleteTargetId}
        onOpenChange={(open) => {
          if (!open) vm.cancelDelete();
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this case
            study.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={vm.cancelDelete}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={vm.confirmDelete}
              disabled={vm.isDeleting}
            >
              {vm.isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
