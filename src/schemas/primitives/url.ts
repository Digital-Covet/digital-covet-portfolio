import { z } from "zod";

const relativeOrAbsoluteUrl = z.string().refine(
  (val) => {
    try {
      new URL(val);
      return true;
    } catch {
      return val.startsWith("/");
    }
  },
  { message: "Must be a valid URL or a path starting with /" },
);

export const urlSchema = relativeOrAbsoluteUrl;

const ALLOWED_VIDEO_EMBED_HOSTS = new Set([
  "www.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "player.vimeo.com",
]);

function isAllowedEmbedHost(raw: string): boolean {
  try {
    return ALLOWED_VIDEO_EMBED_HOSTS.has(new URL(raw).hostname);
  } catch {
    return false;
  }
}

export const videoEmbedUrlSchema = urlSchema
  .refine(isAllowedEmbedHost, {
    message: "Only YouTube and Vimeo embed URLs are accepted",
  })
  .nullable()
  .optional();
