"use client";

import dynamic from "next/dynamic";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Taxonomy } from "@/types/case-studies";
import "katex/dist/katex.min.css";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

const MDEditor = dynamic(
  () => import("@uiw/react-md-editor").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[300px] w-full items-center justify-center rounded-md border bg-muted/20 text-sm text-muted-foreground">
        Loading editor...
      </div>
    ),
  },
);

const markdownPreviewOptions = {
  remarkPlugins: [remarkMath],
  rehypePlugins: [rehypeKatex],
};

export function Field({
  label,
  value,
  onChangeAction,
  rows = 2,
  enableMarkdown = false,
}: {
  label: string;
  value: string | null;
  onChangeAction: (v: string | null) => void;
  rows?: number;
  enableMarkdown?: boolean;
}) {
  if (enableMarkdown) {
    // Calculate height based on rows prop for consistency
    const editorHeight = Math.max(400, rows * 100);

    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div
          className="markdown-editor-wrapper overflow-hidden rounded-md border border-input"
          data-color-mode="light"
        >
          <MDEditor
            value={value ?? ""}
            onChange={(val) => onChangeAction(val || null)}
            preview="live"
            height={editorHeight}
            minHeight={editorHeight}
            visibleDragbar={false}
            highlightEnable={false}
            className="!border-0 !shadow-none"
            previewOptions={markdownPreviewOptions}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Supports Markdown: **bold**, *italic*, [links](url), lists, $inline
          math$, $$block math$$
        </p>
      </div>
    );
  }

  // Standard textarea for non-markdown fields
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Textarea
        rows={rows}
        value={value ?? ""}
        onChange={(e) => onChangeAction(e.target.value || null)}
        style={{ minHeight: `${Math.max(rows * 36 + 40, 100)}px` }}
      />
    </div>
  );
}

export function TagSelector({
  label,
  items,
  selected,
  onToggleAction,
}: {
  label: string;
  items: Taxonomy[];
  selected: string[];
  onToggleAction: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          None defined yet — add some in Taxonomies.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((it) => (
            <button
              key={it.id}
              type="button"
              onClick={() => onToggleAction(it.id)}
              className={`border px-3 py-1 text-xs transition-colors ${
                selected.includes(it.id)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-muted"
              }`}
            >
              {it.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
