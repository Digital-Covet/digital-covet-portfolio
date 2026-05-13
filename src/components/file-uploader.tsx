import { UploadSimpleIcon, XIcon } from "@phosphor-icons/react";
import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { getUploadPresignedUrl } from "@/actions/files";
import type { ImageRequirement } from "@/utils/image-validation";
import { validateImage } from "@/utils/image-validation";
import { Button } from "@/components/ui/button";

type Bucket = "client-logos" | "case-study-media" | "case-study-attachments";

export function FileUploader({
  bucket,
  accept,
  label = "Upload",
  onUploaded,
  imageRequirement,
  hint,
  multiple,
  maxFiles,
}: {
  bucket: Bucket;
  accept?: string;
  label?: string;
  onUploaded: (file: { url: string; name: string }) => void;
  imageRequirement?: ImageRequirement;
  hint?: string;
  multiple?: boolean;
  maxFiles?: number;
}) {
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    if (maxFiles && files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const fileArray = multiple ? Array.from(files) : [files[0]];

    for (const file of fileArray) {
      if (file.size > 15 * 1024 * 1024) {
        toast.error(`${file.name}: File too large (max 15MB)`);
        continue;
      }

      if (imageRequirement) {
        const result = await validateImage(file, imageRequirement);
        if (!result.valid) {
          toast.error(`${file.name}: ${result.error}`);
          continue;
        }
      }

      const contentType = file.type || "application/octet-stream";

      startTransition(async () => {
        try {
          const res = await getUploadPresignedUrl({
            bucket,
            filename: file.name,
            contentType,
          });

          if (!res.ok) {
            toast.error(res.error.message);
            return;
          }

          const uploadRes = await fetch(res.data.presignedUrl, {
            method: "PUT",
            body: file,
            headers: {
              "Content-Type": contentType,
            },
          });

          if (!uploadRes.ok) {
            const detail = await uploadRes.text().catch(() => "");
            console.error("R2 upload failed:", uploadRes.status, detail);
            toast.error("Upload to storage failed");
            return;
          }

          onUploaded({ url: res.data.proxyUrl, name: file.name });
          toast.success("Uploaded");
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Upload failed");
        }
      });
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="sr-only peer"
        accept={accept}
        multiple={multiple}
        onChange={(e) => handleFiles(e.target.files)}
        disabled={isPending}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        className="cursor-pointer"
        onClick={() => inputRef.current?.click()}
      >
        <UploadSimpleIcon size={16} className="mr-2" />
        {isPending ? "Uploading…" : label}
      </Button>
      {hint && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </>
  );
}

export function ImagePreview({
  url,
  onRemove,
}: {
  url: string;
  onRemove?: () => void;
}) {
  return (
    <div className="group relative inline-block">
      <img
        src={url}
        alt=""
        className="h-24 w-24 rounded-md border object-cover"
      />
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
        >
          <XIcon size={16} />
        </button>
      )}
    </div>
  );
}
