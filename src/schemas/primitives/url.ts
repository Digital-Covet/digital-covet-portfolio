import { z } from "zod";

export const urlSchema = z.url();

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
