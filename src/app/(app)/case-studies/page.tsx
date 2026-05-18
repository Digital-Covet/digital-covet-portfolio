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
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCaseStudiesList } from "@/hooks/case-studies/useCaseStudiesList";

const STATUS_FILTERS = ["all", "published", "draft", "archived"] as const;

export default function CaseStudiesListPage() {
  const vm = useCaseStudiesList(); // ✅ All logic encapsulated in hook

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
        <div className="flex gap-1 border p-1 rounded">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => vm.setStatusFilter(filter)}
              className={`px-3 py-1 text-xs font-medium capitalize transition-colors rounded ${
                vm.statusFilter === filter
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
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
          {vm.isLoading && vm.studies.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center py-12 text-muted-foreground"
              >
                Loading…
              </TableCell>
            </TableRow>
          ) : vm.studies.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center py-12 text-muted-foreground"
              >
                No case studies found.
              </TableCell>
            </TableRow>
          ) : (
            vm.studies.map((study) => (
              <TableRow key={study.id}>
                <TableCell className="font-medium">{study.title}</TableCell>
                <TableCell>{study.client?.name ?? "No client"}</TableCell>
                <TableCell>
                  {study.keyBusinesses.map((k) => k.name).join(", ") ||
                    "No key business"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      study.status === "published" ? "default" : "secondary"
                    }
                  >
                    {study.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
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
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

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
