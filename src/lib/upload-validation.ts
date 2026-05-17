export const UPLOAD_LIMITS = {
  "client-logos": {
    maxSizeBytes: 5 * 1024 * 1024, // 5 MB
    allowedTypes: ["image/jpeg", "image/png", "image/webp"] as const,
    allowedExtensions: [".jpg", ".jpeg", ".png", ".webp"] as const,
  },
  "case-study-media": {
    maxSizeBytes: 20 * 1024 * 1024, // 20 MB
    allowedTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ] as const,
    allowedExtensions: [".jpg", ".jpeg", ".png", ".webp", ".gif"] as const,
  },
  "case-study-attachments": {
    maxSizeBytes: 50 * 1024 * 1024, // 50 MB
    allowedTypes: ["application/pdf"] as const,
    allowedExtensions: [".pdf"] as const,
  },
} as const;

export type UploadBucket = keyof typeof UPLOAD_LIMITS;

export type UploadValidationError =
  | { type: "INVALID_EXTENSION"; extension: string; allowed: readonly string[] }
  | { type: "INVALID_MIME_TYPE"; mimeType: string; allowed: readonly string[] }
  | { type: "FILE_TOO_LARGE"; size: number; maxSize: number }
  | { type: "MIME_EXTENSION_MISMATCH"; extension: string; mimeType: string };

/**
 * Validates upload parameters against bucket-specific rules.
 */
export function validateUpload(
  bucket: UploadBucket,
  filename: string,
  contentType: string,
  fileSizeBytes?: number,
): { valid: true } | { valid: false; error: UploadValidationError } {
  const config = UPLOAD_LIMITS[bucket];

  // Extract file extension
  const extension = filename.toLowerCase().match(/\.[^.]+$/)?.[0];
  if (!extension || !config.allowedExtensions.includes(extension as never)) {
    return {
      valid: false,
      error: {
        type: "INVALID_EXTENSION",
        extension: extension ?? "(none)",
        allowed: config.allowedExtensions,
      },
    };
  }

  // Validate MIME type
  if (!config.allowedTypes.includes(contentType as never)) {
    return {
      valid: false,
      error: {
        type: "INVALID_MIME_TYPE",
        mimeType: contentType,
        allowed: config.allowedTypes,
      },
    };
  }

  // Cross-check extension vs MIME type
  const mimeToExtension: Record<string, string[]> = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/webp": [".webp"],
    "image/gif": [".gif"],
    "application/pdf": [".pdf"],
  };

  const expectedExtensions = mimeToExtension[contentType] ?? [];
  if (
    expectedExtensions.length > 0 &&
    !expectedExtensions.includes(extension)
  ) {
    return {
      valid: false,
      error: {
        type: "MIME_EXTENSION_MISMATCH",
        extension,
        mimeType: contentType,
      },
    };
  }

  // Validate file size (if provided)
  if (fileSizeBytes !== undefined && fileSizeBytes > config.maxSizeBytes) {
    return {
      valid: false,
      error: {
        type: "FILE_TOO_LARGE",
        size: fileSizeBytes,
        maxSize: config.maxSizeBytes,
      },
    };
  }

  return { valid: true };
}

export function formatUploadError(error: UploadValidationError): string {
  switch (error.type) {
    case "INVALID_EXTENSION":
      return `Invalid file extension "${error.extension}". Allowed: ${error.allowed.join(", ")}`;
    case "INVALID_MIME_TYPE":
      return `Invalid file type "${error.mimeType}". Allowed: ${error.allowed.join(", ")}`;
    case "FILE_TOO_LARGE":
      return `File size ${(error.size / 1024 / 1024).toFixed(1)} MB exceeds limit of ${(error.maxSize / 1024 / 1024).toFixed(1)} MB`;
    case "MIME_EXTENSION_MISMATCH":
      return `File extension "${error.extension}" doesn't match content type "${error.mimeType}"`;
  }
}
