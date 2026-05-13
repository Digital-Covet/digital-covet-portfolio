"use client";

import { useRouter } from "next/navigation";
import { type ChangeEvent, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { createAvatarUploadUrl } from "@/actions/account";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

const fileSchema = z
  .instanceof(File)
  .refine((file) => file.size > 0, "Choose an image file.")
  .refine((file) => file.size <= 5 * 1024 * 1024, "Images must be 5MB or less.")
  .refine((file) => file.type.startsWith("image/"), "Choose an image file.");

interface AvatarUploadProps {
  userName: string;
  currentImage: string | null;
}

export function AvatarUpload({ userName, currentImage }: AvatarUploadProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(currentImage);
  const { refetch } = authClient.useSession();

  const openPicker = () => inputRef.current?.click();

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    const parsedFile = fileSchema.safeParse(file);
    if (!parsedFile.success) {
      toast.error(parsedFile.error.issues[0]?.message ?? "Invalid image.");
      return;
    }

    setUploading(true);

    try {
      const response = await createAvatarUploadUrl({
        contentType: parsedFile.data.type,
      });

      if (!response.ok) {
        toast.error(response.error?.message ?? "Could not start the upload.");
        return;
      }

      const upload = await fetch(response.data.presignedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": parsedFile.data.type,
        },
        body: parsedFile.data,
      });

      if (!upload.ok) {
        toast.error("Avatar upload failed.");
        return;
      }

      const { error } = await authClient.updateUser({
        image: response.data.proxyUrl,
      });

      if (error) {
        toast.error(error.message ?? "Could not update your profile image.");
        return;
      }

      setPreviewImage(response.data.proxyUrl);
      await refetch();
      router.refresh();
      toast.success("Profile image updated.");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Avatar upload failed.";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const initials = userName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
    .slice(0, 2);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile image</CardTitle>
        <CardDescription>
          Upload a new avatar. The image is stored in R2 and served through the
          proxy route.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border bg-muted text-lg font-semibold">
            {previewImage ? (
              <img
                src={previewImage}
                alt={userName}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{initials || "U"}</span>
            )}
          </div>
          <div className="space-y-1">
            <p className="font-medium">{userName}</p>
            <p className="text-sm text-muted-foreground">PNG, JPG, WEBP</p>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <Button
          type="button"
          variant="outline"
          onClick={openPicker}
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "Choose image"}
        </Button>
      </CardContent>
    </Card>
  );
}
