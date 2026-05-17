"use client";

import { UploadSimpleIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useFileUpload } from "@/hooks/useFileUpload";
import type { ImageRequirement } from "@/utils/image-validation";

type Bucket = "client-logos" | "case-study-media" | "case-study-attachments";

export function FileUploader({
  bucket,
  accept,
  label = "Upload",
  onUploadedAction,
  imageRequirement,
  hint,
  multiple,
  maxFiles,
  caseStudyId,
  isNew,
  onSaveAndReturnIdAction,
  onSaveAfterUploadAction,
}: {
  bucket: Bucket;
  accept?: string;
  label?: string;
  onUploadedAction: (file: { url: string; name: string }) => void;
  imageRequirement?: ImageRequirement;
  hint?: string;
  multiple?: boolean;
  maxFiles?: number;
  caseStudyId?: string;
  isNew?: boolean;
  onSaveAndReturnIdAction?: () => Promise<{ ok: boolean; id?: string }>;
  onSaveAfterUploadAction?: () => Promise<{ ok: boolean }>;
}) {
  const { inputRef, isUploading, openFilePicker, handleInputChange } =
    useFileUpload({
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

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        className="sr-only peer"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        disabled={isUploading}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isUploading}
        className="cursor-pointer"
        onClick={openFilePicker}
      >
        <UploadSimpleIcon size={16} className="mr-2" />
        {isUploading ? "Uploading…" : label}
      </Button>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function ImagePreview({
  url,
  onRemoveAction,
}: {
  url: string;
  onRemoveAction?: () => void;
}) {
  return (
    <div className="group relative inline-block">
      <img
        src={url}
        alt=""
        className="h-24 w-24 rounded-md border object-cover"
      />
      {onRemoveAction && (
        <button
          type="button"
          onClick={onRemoveAction}
          className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
        >
          <XIcon size={16} />
        </button>
      )}
    </div>
  );
}
