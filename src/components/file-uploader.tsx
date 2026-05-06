import { UploadSimpleIcon, XIcon } from "@phosphor-icons/react";
import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { uploadFile } from "@/actions/content";
import { Button } from "@/components/ui/button";

type Bucket = "client-logos" | "case-study-media" | "case-study-attachments";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const idx = result.indexOf(",");
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function FileUploader({
  bucket,
  accept,
  label = "Upload",
  onUploaded,
}: {
  bucket: Bucket;
  accept?: string;
  label?: string;
  onUploaded: (file: { url: string; name: string }) => void;
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

    startTransition(async () => {
      try {
        const dataBase64 = await fileToBase64(file);
        const res = await uploadFile({
          bucket,
          filename: file.name,
          dataBase64,
          contentType: file.type || "application/octet-stream",
        });
        if (!res.ok) {
          toast.error(res.error.message);
          return;
        }
        onUploaded({ url: res.data.url, name: file.name });
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
