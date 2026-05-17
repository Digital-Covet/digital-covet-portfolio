"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getUploadPresignedUrl } from "@/actions/files";
import {
  formatUploadError,
  type UploadBucket,
  validateUpload,
} from "@/lib/upload-validation";
import type { ImageRequirement } from "@/utils/image-validation";
import { validateImage } from "@/utils/image-validation";

const MIME_BY_EXTENSION: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".pdf": "application/pdf",
};

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "application/pdf": ".pdf",
};

export type UploadQueueItem = {
  id: string;
  fileName: string;
  fileSize: number;
  status: "pending" | "success" | "error";
  message?: string;
  url?: string;
};

type UploadEntry = {
  id: string;
  file: File;
};

export function isAcceptedFile(file: File, accept?: string): boolean {
  if (!accept) return true;

  const tokens = accept
    .split(",")
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);

  if (tokens.length === 0) return true;

  return tokens.some((token) => {
    if (token.startsWith(".")) {
      return file.name.toLowerCase().endsWith(token);
    }
    if (token.endsWith("/*")) {
      const prefix = token.slice(0, -1);
      return file.type.toLowerCase().startsWith(prefix);
    }
    return file.type.toLowerCase() === token;
  });
}

export function filterAcceptedFiles(files: File[], accept?: string): File[] {
  return files.filter((file) => isAcceptedFile(file, accept));
}

export function getFilesFromClipboardEvent(
  event: ClipboardEvent,
  accept?: string,
): File[] {
  const items = event.clipboardData?.items;
  if (!items) return [];

  const files: File[] = [];
  for (const item of items) {
    if (item.kind !== "file") continue;
    const file = item.getAsFile();
    if (!file) continue;
    files.push(file);
  }

  return filterAcceptedFiles(files, accept);
}

function getExtension(filename: string): string | null {
  return filename.toLowerCase().match(/\.[^.]+$/)?.[0] ?? null;
}

function normalizeFileForUpload(file: File): File {
  const currentExtension = getExtension(file.name);
  const inferredMime =
    file.type || (currentExtension ? MIME_BY_EXTENSION[currentExtension] : "");
  const inferredExtension =
    currentExtension || (inferredMime ? EXTENSION_BY_MIME[inferredMime] : "");

  if (!inferredExtension) return file;

  const nextName = currentExtension
    ? file.name
    : `${file.name || "upload"}${inferredExtension}`;
  const nextType = inferredMime || MIME_BY_EXTENSION[inferredExtension] || "";

  if (nextName === file.name && nextType === file.type) {
    return file;
  }

  return new File([file], nextName, {
    type: nextType,
    lastModified: file.lastModified,
  });
}

function makeUploadId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

export function useFileUpload({
  bucket,
  imageRequirement,
  multiple,
  maxFiles,
  onUploadedAction,
  caseStudyId,
  isNew,
  onSaveAndReturnIdAction,
  onSaveAfterUploadAction,
}: {
  bucket: UploadBucket;
  accept?: string;
  imageRequirement?: ImageRequirement;
  multiple?: boolean;
  maxFiles?: number;
  onUploadedAction: (file: { url: string; name: string }) => void;
  caseStudyId?: string;
  isNew?: boolean;
  onSaveAndReturnIdAction?: () => Promise<{ ok: boolean; id?: string }>;
  onSaveAfterUploadAction?: () => Promise<{ ok: boolean }>;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);
  const saveLockRef = useRef<Promise<unknown> | null>(null);
  const creatingDraftRef = useRef<Promise<string> | null>(null);
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  const runSerializedSave = useCallback(async () => {
    if (!onSaveAfterUploadAction) return;

    while (saveLockRef.current) {
      await saveLockRef.current;
    }

    const savePromise = (async () => {
      const result = await onSaveAfterUploadAction();

      if (!result.ok) {
        throw new Error("Failed to save uploaded media changes");
      }
    })();

    saveLockRef.current = savePromise;

    try {
      await savePromise;
    } finally {
      if (saveLockRef.current === savePromise) {
        saveLockRef.current = null;
      }
    }
  }, [onSaveAfterUploadAction]);
  const ensureCaseStudyId = useCallback(async (): Promise<
    string | undefined
  > => {
    if (!isNew || !onSaveAndReturnIdAction) {
      return caseStudyId;
    }

    if (!creatingDraftRef.current) {
      creatingDraftRef.current = (async () => {
        const saveResult = await onSaveAndReturnIdAction();

        if (!saveResult.ok || !saveResult.id) {
          throw new Error("Please save the case study before uploading media");
        }

        return saveResult.id;
      })().finally(() => {
        creatingDraftRef.current = null;
      });
    }

    return creatingDraftRef.current;
  }, [caseStudyId, isNew, onSaveAndReturnIdAction]);
  const uploadFiles = useCallback(
    async (
      files: File[],
      options?: {
        onItemUpdate?: (item: UploadQueueItem) => void;
      },
    ): Promise<UploadQueueItem[]> => {
      const selected = multiple
        ? Array.from(files)
        : Array.from(files).slice(0, 1);
      if (selected.length === 0) return [];

      if (maxFiles && selected.length > maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed`);
        return [];
      }

      const normalized = selected.map(normalizeFileForUpload);
      const uploadEntries: UploadEntry[] = normalized.map((file) => ({
        id: makeUploadId(),
        file,
      }));

      const items: UploadQueueItem[] = uploadEntries.map(({ id, file }) => ({
        id,
        fileName: file.name,
        fileSize: file.size,
        status: "pending",
      }));

      const results = [...items];

      const updateItem = (next: UploadQueueItem) => {
        if (!isMountedRef.current) return;

        const index = results.findIndex((item) => item.id === next.id);
        if (index >= 0) {
          results[index] = next;
        }
        options?.onItemUpdate?.(next);
      };

      for (const item of items) {
        updateItem(item);
      }

      const validations = await Promise.all(
        uploadEntries.map(async ({ file }, index) => {
          const item = items[index];
          const contentType = file.type || "application/octet-stream";

          const uploadValidation = validateUpload(
            bucket,
            file.name,
            contentType,
            file.size,
          );
          if (!uploadValidation.valid) {
            return {
              item,
              file,
              ok: false as const,
              message: formatUploadError(uploadValidation.error),
            };
          }

          if (imageRequirement) {
            const imageValidation = await validateImage(file, imageRequirement);
            if (!imageValidation.valid) {
              return {
                item,
                file,
                ok: false as const,
                message: imageValidation.error,
              };
            }
          }

          return { item, file, ok: true as const, contentType };
        }),
      );

      const uploadable: Array<{
        item: UploadQueueItem;
        file: File;
        contentType: string;
      }> = [];

      for (const validation of validations) {
        if (!validation.ok) {
          const errorItem: UploadQueueItem = {
            ...validation.item,
            status: "error",
            message: validation.message,
          };
          updateItem(errorItem);
          toast.error(`${validation.item.fileName}: ${validation.message}`);
          continue;
        }

        uploadable.push({
          item: validation.item,
          file: validation.file,
          contentType: validation.contentType,
        });
      }

      if (uploadable.length === 0) {
        return results;
      }

      if (isMountedRef.current) {
        setIsUploading(true);
      }

      try {
        let effectiveCaseStudyId: string | undefined;

        try {
          effectiveCaseStudyId = await ensureCaseStudyId();
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Unable to create draft before upload",
          );

          return results;
        }

        const settled = await Promise.allSettled(
          uploadable.map(async ({ item, file, contentType }) => {
            const presigned = await getUploadPresignedUrl({
              bucket,
              filename: file.name,
              contentType,
              fileSizeBytes: file.size,
              caseStudyId: effectiveCaseStudyId,
            });

            if (!presigned.ok) {
              throw new Error(presigned.error.message);
            }

            const uploadRes = await fetch(presigned.data.presignedUrl, {
              method: "PUT",
              body: file,
              headers: {
                "Content-Type": contentType,
              },
            });

            if (!uploadRes.ok) {
              const detail = await uploadRes.text().catch(() => "");
              throw new Error(
                `Upload failed (${uploadRes.status}): ${detail || "Unknown error"}`,
              );
            }

            return {
              item,
              url: presigned.data.proxyUrl,
            };
          }),
        );

        let successCount = 0;
        let failCount = 0;

        settled.forEach((result, index) => {
          const { item } = uploadable[index];

          if (result.status === "fulfilled") {
            const successItem: UploadQueueItem = {
              ...item,
              status: "success",
              url: result.value.url,
            };
            updateItem(successItem);

            if (isMountedRef.current) {
              onUploadedAction({
                url: result.value.url,
                name: item.fileName,
              });
            }

            successCount++;
            return;
          }

          const message =
            result.reason instanceof Error
              ? result.reason.message
              : "Upload failed";

          const errorItem: UploadQueueItem = {
            ...item,
            status: "error",
            message,
          };
          updateItem(errorItem);
          toast.error(`${item.fileName}: ${message}`);
          failCount++;
        });

        if (successCount > 0) {
          try {
            await runSerializedSave();

            toast.success(
              `${successCount} file${successCount === 1 ? "" : "s"} uploaded`,
            );
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : "Upload succeeded but autosave failed",
            );
          }
        }

        if (failCount > 0) {
          toast.error(`${failCount} file${failCount === 1 ? "" : "s"} failed`);
        }
      } finally {
        if (isMountedRef.current) {
          setIsUploading(false);
        }
      }

      return results;
    },
    [
      bucket,
      ensureCaseStudyId,
      imageRequirement,
      maxFiles,
      multiple,
      onUploadedAction,
      runSerializedSave,
    ],
  );

  const openFilePicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.currentTarget.files ?? []);
      event.currentTarget.value = "";
      await uploadFiles(files);
    },
    [uploadFiles],
  );

  const handleDropFiles = useCallback(
    async (files: File[]) => {
      await uploadFiles(files);
    },
    [uploadFiles],
  );

  return {
    inputRef,
    isUploading,
    openFilePicker,
    handleInputChange,
    handleDropFiles,
    uploadFiles,
  };
}
