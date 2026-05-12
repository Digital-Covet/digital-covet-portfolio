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
}: {
  bucket: Bucket;
  accept?: string;
  label?: string;
  onUploaded: (file: { url: string; name: string }) => void;
  imageRequirement?: ImageRequirement;
}) {
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      toast.error("File too large (max 15MB)");
      return;
    }

    if (imageRequirement) {
      const result = await validateImage(file, imageRequirement);
      if (!result.valid) {
        toast.error(result.error);
        e.target.value = "";
        return;
      }
    }

    const contentType = file.type || "application/octet-stream";

    startTransition(async () => {
      try {
        // Step 1: Request a pre-signed URL from the server
        const res = await getUploadPresignedUrl({
          bucket,
          filename: file.name,
          contentType,
        });

        if (!res.ok) {
          toast.error(res.error.message);
          return;
        }

        // Step 2: PUT the file directly to R2 using the pre-signed URL
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

        // Step 3: Surface the proxy URL to the parent form
        onUploaded({ url: res.data.proxyUrl, name: file.name });
        toast.success("Uploaded");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      } finally {
        e.target.value = "";
      }
    });
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="sr-only peer"
        accept={accept}
        onChange={handle}
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
