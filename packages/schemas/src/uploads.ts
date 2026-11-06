import { z } from "@hono/zod-openapi";
import { Id, Timestamp } from "./common.ts";

export const MAX_UPLOAD_BYTES = 200 * 1024 * 1024;

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

export const CreateUploadInput = z
  .strictObject({
    filename: z.string().trim().min(1).max(255),
    mime: z.enum(UPLOAD_MIME_TYPES),
    size: z.number().int().positive().max(MAX_UPLOAD_BYTES),
  })
  .openapi("CreateUploadInput");
export type CreateUploadInput = z.infer<typeof CreateUploadInput>;

export const UploadTicket = z
  .object({
    id: Id,
    uploadUrl: z.url(),
    method: z.literal("PUT"),
    headers: z.record(z.string(), z.string()),
    expiresAt: Timestamp,
  })
  .openapi("UploadTicket");
export type UploadTicket = z.infer<typeof UploadTicket>;

export const Upload = z
  .object({
    id: Id,
    filename: z.string(),
    status: z.enum(["pending", "completed", "consumed"]),
    detectedMime: z.string().nullable(),
    byteSize: z.number().int().nullable(),
  })
  .openapi("Upload");
export type Upload = z.infer<typeof Upload>;
