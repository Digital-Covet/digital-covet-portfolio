"use client";

import { UploadSimpleIcon } from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  getFilesFromClipboardEvent,
  type UploadQueueItem,
  useFileUpload,
} from "@/hooks/useFileUpload";
import type { UploadBucket } from "@/lib/upload-validation";
import type { ImageRequirement } from "@/utils/image-validation";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function statusLabel(status: UploadQueueItem["status"]): string {
  switch (status) {
    case "pending":
      return "Uploading…";
    case "success":
      return "Uploaded";
    case "error":
      return "Failed";
  }
}

export function ImageUploadDialog({
  bucket,
  accept = "image/*",
  title = "Upload images",
  description = "Drag and drop images, browse files, or paste from the clipboard while this dialog is open and focused.",
  triggerLabel = "Add images",
  imageRequirement,
  multiple = true,
  maxFiles = 30,
  onUploadedAction,
  caseStudyId,
  isNew,
  onSaveAndReturnIdAction,
  onSaveAfterUploadAction,
}: {
  bucket: UploadBucket;
  accept?: string;
  title?: string;
  description?: string;
  triggerLabel?: string;
  imageRequirement?: ImageRequirement;
  multiple?: boolean;
  maxFiles?: number;
  onUploadedAction: (file: { url: string; name: string }) => void;
  caseStudyId?: string;
  isNew?: boolean;
  onSaveAndReturnIdAction?: () => Promise<{ ok: boolean; id?: string }>;
  onSaveAfterUploadAction?: () => Promise<{ ok: boolean }>;
}) {
  const [open, setOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [items, setItems] = useState<UploadQueueItem[]>([]);
  const dialogBodyRef = useRef<HTMLDivElement>(null);
  const dragCounterRef = useRef(0);

  const {
    inputRef,
    isUploading,
    openFilePicker,
    handleInputChange,
    uploadFiles,
  } = useFileUpload({
    bucket,
    accept,
    imageRequirement,
    multiple,
    maxFiles,
    onUploadedAction,
    caseStudyId,
    isNew,
    onSaveAndReturnIdAction,
    onSaveAfterUploadAction,
  });

  const upsertItem = useCallback((next: UploadQueueItem) => {
    setItems((current) => {
      const index = current.findIndex((item) => item.id === next.id);
      if (index === -1) return [...current, next];
      const copy = [...current];
      copy[index] = next;
      return copy;
    });
  }, []);

  // The clipboard listener is intentionally scoped to the modal lifecycle and
  // focus state so we do not recreate the global paste side effect that existed
  // in the original button-only uploader.
  useEffect(() => {
    if (!open || !isFocused) return;

    const handlePaste = async (event: ClipboardEvent) => {
      const files = getFilesFromClipboardEvent(event, accept);
      if (files.length === 0) return;

      event.preventDefault();
      event.stopPropagation();

      await uploadFiles(files, {
        onItemUpdate: upsertItem,
      });
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [accept, isFocused, open, uploadFiles, upsertItem]);
  useEffect(() => {
    if (open || isUploading) return;
    setItems([]);
    setIsDragging(false);
    dragCounterRef.current = 0;
  }, [open, isUploading]);
  const handleDrop = useCallback(
    async (event: React.DragEvent<HTMLButtonElement>) => {
      event.preventDefault();
      dragCounterRef.current = 0;
      setIsDragging(false);

      const files = Array.from(event.dataTransfer.files ?? []);
      if (files.length === 0) return;

      await uploadFiles(files, {
        onItemUpdate: upsertItem,
      });
    },
    [upsertItem, uploadFiles],
  );

  const dropZoneClassName = useMemo(() => {
    return [
      "flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center transition-colors",
      isDragging
        ? "border-primary bg-primary/5"
        : "border-muted-foreground/25 bg-muted/20 hover:border-primary/60 hover:bg-muted/40",
    ].join(" ");
  }, [isDragging]);

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (isOpen) {
          setIsFocused(true);
          requestAnimationFrame(() => dialogBodyRef.current?.focus());
        } else {
          setIsFocused(false);
        }
      }}
    >
      <DialogTrigger
        render={
          <Button type="button" variant="outline" size="sm">
            <UploadSimpleIcon size={16} className="mr-2" />
            {triggerLabel}
          </Button>
        }
      ></DialogTrigger>

      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden" initialFocus={false}>
        <div
          ref={dialogBodyRef}
          tabIndex={-1}
          className="space-y-4 outline-none overflow-y-auto max-h-[calc(85vh-3rem)] pr-2"
          onFocusCapture={() => setIsFocused(true)}
          onBlurCapture={(event) => {
            const nextTarget = event.relatedTarget as Node | null;
            if (!dialogBodyRef.current?.contains(nextTarget)) {
              setIsFocused(false);
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            accept={accept}
            multiple={multiple}
            onChange={handleInputChange}
            disabled={isUploading}
          />

          <Card>
            <CardContent className="space-y-4 p-4 w-full [&>*]:w-full">
              <button
                type="button"
                className={dropZoneClassName}
                onClick={openFilePicker}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openFilePicker();
                  }
                }}
                onDragEnter={(event: React.DragEvent<HTMLButtonElement>) => {
                  event.preventDefault();
                  dragCounterRef.current += 1;
                  setIsDragging(true);
                }}
                onDragOver={(event: React.DragEvent<HTMLButtonElement>) => {
                  event.preventDefault();
                }}
                onDragLeave={(event: React.DragEvent<HTMLButtonElement>) => {
                  event.preventDefault();
                  dragCounterRef.current -= 1;
                  if (dragCounterRef.current <= 0) {
                    dragCounterRef.current = 0;
                    setIsDragging(false);
                  }
                }}
                onDrop={handleDrop}
              >
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Drop images here to upload
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Paste from clipboard, drag and drop, or browse files.
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={openFilePicker}
                    disabled={isUploading}
                  >
                    Browse files
                  </Button>
                </div>
              </button>

              <div className="rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground">
                Paste is only enabled while this dialog is open and focused.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Upload queue</h3>
                <p className="text-xs text-muted-foreground">
                  {items.length} file{items.length === 1 ? "" : "s"}
                </p>
              </div>

              <div className="space-y-2">
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No files yet. Drop, browse, or paste to begin.
                  </p>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-3 rounded-md border px-3 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{item.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatBytes(item.fileSize)}
                        </p>
                        {item.message && (
                          <p className="mt-1 text-xs text-destructive">
                            {item.message}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-xs font-medium text-muted-foreground">
                        {statusLabel(item.status)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
