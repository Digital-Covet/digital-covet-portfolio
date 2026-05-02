"use client";
import {
  MagnifyingGlassIcon,
  PencilSimpleIcon,
  PlusIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { deleteCaseStudy, listCaseStudies } from "@/actions/content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { CaseStudyListItem } from "@/types/case-studies";

export default function CaseStudiesListPage() {
  const [studies, setStudies] = useState<CaseStudyListItem[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "draft" | "published">("all");

  const load = useCallback(
    () =>
      listCaseStudies().then((r) =>
        setStudies(r.studies as CaseStudyListItem[]),
      ),
    [],
  );

  useEffect(() => {
    load();
  }, [load]);

  const filtered = studies.filter((s) => {
    if (filter !== "all" && s.status !== filter) return false;
    if (q && !s.title.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  async function onDelete(id: string) {
    if (!confirm("Delete this case study?")) return;
    try {
      await deleteCaseStudy({ id });
      toast.success("Deleted");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div className="max-w-6xl p-6 md:p-10">
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
              <PlusIcon size={16} className="mr-2" /> New case study
            </Link>
          }
        ></Button>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-50">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search title…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex gap-1 border p-1">
          {(["all", "published", "draft"] as const).map((f) => (
            <button
              type="button"
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs font-medium capitalize ${filter === f
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
                }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        {filtered.map((s) => (
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
                  {s.industry?.name ?? "No industry"}
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
                onClick={() => onDelete(s.id)}
              >
                <TrashIcon size={16} />
              </Button>
            </div>
          </Card>
        ))}
        {!filtered.length && (
          <div className="rounded-md border border-dashed py-12 text-center text-sm text-muted-foreground">
            No case studies yet.
          </div>
        )}
      </div>
    </div>
  );
}
