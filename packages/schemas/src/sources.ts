import { z } from "@hono/zod-openapi";
import { Id, page, Timestamp } from "./common.ts";
import { MAX_PASTED_TEXT_CHARS } from "./constants.ts";

export const SourceKind = z
  .enum(["pdf", "image", "video", "audio", "transcript", "youtube", "web", "text", "docx"])
  .openapi("SourceKind");
export type SourceKind = z.infer<typeof SourceKind>;
export const SourceStatus = z
  .enum(["pending", "processing", "ready", "partial", "failed"])
  .openapi("SourceStatus");
export type SourceStatus = z.infer<typeof SourceStatus>;

export const Source = z
  .object({
    id: Id,
    notebookId: Id,
    kind: SourceKind,
    title: z.string(),
    originUrl: z.string().nullable(),
    mime: z.string().nullable(),
    byteSize: z.number().int().nullable(),
    status: SourceStatus,
    error: z.object({ code: z.string(), message: z.string() }).nullable(),
    isSelected: z.boolean(),
    priority: z.number().int(),
    addedVia: z.string(),
    createdAt: Timestamp,
    updatedAt: Timestamp,
  })
  .openapi("Source");
export type Source = z.infer<typeof Source>;

export const SourcePage = page(Source, "SourcePage");

const OptionalTitle = z.string().trim().min(1).max(300).optional();

export const CreateSourceInput = z
  .discriminatedUnion("type", [
    z.strictObject({ type: z.literal("upload"), uploadId: Id, title: OptionalTitle }),
    z.strictObject({ type: z.literal("url"), url: z.url().max(2048), title: OptionalTitle }),
    z.strictObject({
      type: z.literal("text"),
      title: z.string().trim().min(1).max(300),
      text: z.string().min(1).max(MAX_PASTED_TEXT_CHARS),
    }),
  ])
  .openapi("CreateSourceInput");
export type CreateSourceInput = z.infer<typeof CreateSourceInput>;

export const UpdateSourceInput = z
  .strictObject({
    title: z.string().trim().min(1).max(300).optional(),
    isSelected: z.boolean().optional(),
    priority: z.number().int().min(0).max(10).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "At least one field is required" })
  .openapi("UpdateSourceInput");
export type UpdateSourceInput = z.infer<typeof UpdateSourceInput>;
