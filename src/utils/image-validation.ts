export type ImageValidationResult =
  | { valid: true }
  | { valid: false; error: string };

export type ImageRequirement = {
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  allowedFormats?: string[];
  aspectRatio?: string;
};

export async function validateImage(
  file: File,
  requirement: ImageRequirement,
): Promise<ImageValidationResult> {
  const { minWidth, minHeight, maxWidth, maxHeight, allowedFormats } =
    requirement;

  if (allowedFormats && allowedFormats.length > 0) {
    const valid = allowedFormats.some((fmt) => {
      if (fmt.startsWith("image/")) {
        return file.type === fmt;
      }
      return file.name.toLowerCase().endsWith(`.${fmt}`);
    });

    if (!valid) {
      const exts = allowedFormats
        .map((f) => (f.startsWith("image/") ? f.replace("image/", "") : f))
        .join(", ");
      return {
        valid: false,
        error: `Invalid format. Allowed: ${exts}`,
      };
    }
  }

  const dimensions = await getImageDimensions(file);

  if (requirement.aspectRatio) {
    const [rw, rh] = requirement.aspectRatio.split(":").map(Number);
    if (rw && rh && dimensions.width * rh !== dimensions.height * rw) {
      return {
        valid: false,
        error: `Invalid aspect ratio. Required: ${requirement.aspectRatio}`,
      };
    }
  }

  if (minWidth && dimensions.width < minWidth) {
    return { valid: false, error: `Width must be at least ${minWidth}px` };
  }
  if (minHeight && dimensions.height < minHeight) {
    return { valid: false, error: `Height must be at least ${minHeight}px` };
  }
  if (maxWidth && dimensions.width > maxWidth) {
    return { valid: false, error: `Width must be at most ${maxWidth}px` };
  }
  if (maxHeight && dimensions.height > maxHeight) {
    return { valid: false, error: `Height must be at most ${maxHeight}px` };
  }

  return { valid: true };
}

export async function getImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = reject;
    img.src = url;
  });
}

export const LOGO_REQUIREMENTS: ImageRequirement = {
  minWidth: 512,
  minHeight: 512,
  allowedFormats: ["image/png", "image/jpeg", "image/webp", "image/svg+xml"],
  aspectRatio: "1:1",
};

export const HERO_IMAGE_REQUIREMENTS: ImageRequirement = {
  minWidth: 1660,
  minHeight: 588,
  allowedFormats: ["jpg", "jpeg"],
  aspectRatio: "415:147",
};