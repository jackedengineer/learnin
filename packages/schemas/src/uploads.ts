import { z } from "@hono/zod-openapi";
import { Id, Timestamp } from "./common.ts";
import { MAX_UPLOAD_BYTES, UPLOAD_MIME_TYPES } from "./constants.ts";

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
