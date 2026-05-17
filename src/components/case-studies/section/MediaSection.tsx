import { XIcon } from "@phosphor-icons/react";
import { FileUploader, ImagePreview } from "@/components/file-uploader";
import { ImageUploadDialog } from "@/components/image-upload-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { Attachment } from "@/types/case-studies";
import { HERO_IMAGE_REQUIREMENTS } from "@/utils/image-validation";

type MediaProps = {
  caseStudyId: string;
  isNew: boolean;
  onSaveAndReturnId: () => Promise<{ ok: boolean; id?: string }>;
  onSaveAfterUpload: () => Promise<{ ok: boolean }>;
  heroImageUrl: string | null;
  galleryUrls: string[];
  attachments: Attachment[];
  onHeroChange: (url: string | null) => void;
  onGalleryAdd: (url: string) => void;
  onGalleryRemove: (index: number) => void;
  onAttachmentAdd: (attachment: Attachment) => void;
  onAttachmentRemove: (index: number) => void;
};

export function MediaSection({
  caseStudyId,
  isNew,
  onSaveAndReturnId,
  onSaveAfterUpload,
  heroImageUrl,
  galleryUrls,
  attachments,
  onHeroChange,
  onGalleryAdd,
  onGalleryRemove,
  onAttachmentAdd,
  onAttachmentRemove,
}: MediaProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Media</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Hero image</Label>
          <div className="flex flex-wrap items-center gap-3">
            {heroImageUrl && (
              <ImagePreview
                url={heroImageUrl}
                onRemoveAction={() => onHeroChange(null)}
              />
            )}
            <FileUploader
              bucket="case-study-media"
              accept="image/jpeg,image/jpg"
              label="Upload hero"
              imageRequirement={HERO_IMAGE_REQUIREMENTS}
              hint="Min 1660×588px, 2.82:1 ratio, JPG only"
              caseStudyId={caseStudyId}
              isNew={isNew}
              onSaveAndReturnIdAction={onSaveAndReturnId}
              onSaveAfterUploadAction={onSaveAfterUpload}
              onUploadedAction={(f) => onHeroChange(f.url)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Gallery</Label>
          <div className="flex flex-wrap items-center gap-3">
            {galleryUrls.map((u, i) => (
              <ImagePreview
                key={`${u}-${i}`}
                url={u}
                onRemoveAction={() => onGalleryRemove(i)}
              />
            ))}
            <ImageUploadDialog
              bucket="case-study-media"
              accept="image/*"
              triggerLabel="Add images"
              title="Upload gallery images"
              description="Add up to 30 images. You can drag and drop, browse files, or paste from the clipboard while the dialog is open and focused."
              multiple
              maxFiles={30}
              caseStudyId={caseStudyId}
              isNew={isNew}
              onSaveAndReturnIdAction={onSaveAndReturnId}
              onSaveAfterUploadAction={onSaveAfterUpload}
              onUploadedAction={(f) => onGalleryAdd(f.url)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Attachments (PDFs, decks)</Label>
          <div className="space-y-2">
            {attachments.map((a, i) => (
              <div
                key={`${a.url}-${i}`}
                className="flex items-center justify-between rounded border bg-muted/30 px-3 py-2 text-sm"
              >
                <a
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-primary hover:underline"
                >
                  {a.name}
                </a>
                <button
                  type="button"
                  onClick={() => onAttachmentRemove(i)}
                  className="ml-2"
                >
                  <XIcon size={16} className="text-muted-foreground" />
                </button>
              </div>
            ))}
            <FileUploader
              bucket="case-study-attachments"
              accept=".pdf"
              label="Add PDF"
              caseStudyId={caseStudyId}
              isNew={isNew}
              onSaveAndReturnIdAction={onSaveAndReturnId}
              onSaveAfterUploadAction={onSaveAfterUpload}
              onUploadedAction={(f) =>
                onAttachmentAdd({ name: f.name, url: f.url })
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
