/** Plain constants with no runtime dependencies, safe to import in browser bundles. */
export const MAX_UPLOAD_BYTES = 200 * 1024 * 1024;
export const MAX_PASTED_TEXT_CHARS = 500_000;

/** Declared MIME allow-list. The server re-checks magic bytes on completion. */
export const UPLOAD_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "audio/mpeg",
  "audio/mp4",
  "audio/x-m4a",
  "audio/wav",
  "audio/webm",
  "text/plain",
  "text/markdown",
  "text/vtt",
  "application/x-subrip",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;
export type UploadMime = (typeof UPLOAD_MIME_TYPES)[number];
