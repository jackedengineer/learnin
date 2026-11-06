import { uploadRepo } from "@doubtless/db";
import { CreateUploadInput, IdParam, Upload, UploadTicket } from "@doubtless/schemas";
import { createRoute } from "@hono/zod-openapi";
import { createRouter, errorResponses } from "../lib/openapi.ts";
import { ApiError, notFound } from "../lib/problem.ts";
import { toUpload } from "../lib/serialize.ts";
import { isCompatible, sniffMime, uploadTarget } from "../lib/storage.ts";

const tags = ["Uploads"];
const TICKET_TTL_SECONDS = 15 * 60;
const SNIFF_BYTES = 4096;

const create = createRoute({
  method: "post",
  path: "/",
  tags,
  summary: "Start an upload: returns where to PUT the bytes",
  request: {
    body: { required: true, content: { "application/json": { schema: CreateUploadInput } } },
  },
  responses: {
    201: {
      description: "Upload ticket",
      content: { "application/json": { schema: UploadTicket } },
    },
    ...errorResponses,
  },
});

const complete = createRoute({
  method: "post",
  path: "/{id}/complete",
  tags,
  summary: "Confirm the bytes arrived; verifies size and real file type",
  request: { params: IdParam },
  responses: {
    200: { description: "Verified upload", content: { "application/json": { schema: Upload } } },
    ...errorResponses,
  },
});

export const uploadsRouter = createRouter()
  .openapi(create, async (c) => {
    const input = c.req.valid("json");
    const expiresAt = new Date(Date.now() + TICKET_TTL_SECONDS * 1000);
    const up = await uploadRepo.create(c.var.db, c.var.user.id, {
      filename: input.filename,
      declaredMime: input.mime,
      declaredSize: input.size,
      expiresAt,
    });
    const target = await uploadTarget(c.var.config, up, TICKET_TTL_SECONDS);
    return c.json(
      {
        id: up.id,
        uploadUrl: target.url,
        method: "PUT" as const,
        headers: target.headers,
        expiresAt: expiresAt.toISOString(),
      },
      201,
    );
  })
  .openapi(complete, async (c) => {
    const userId = c.var.user.id;
    const up = await uploadRepo.get(c.var.db, userId, c.req.valid("param").id);
    if (!up) throw notFound("upload");
    if (up.status !== "pending") return c.json(toUpload(up), 200); // idempotent
    const head = await c.env.UPLOADS.head(up.storageKey);
    if (!head) throw new ApiError(409, "upload.not_received", "The file has not been uploaded yet");
    if (head.size !== up.declaredSize) {
      await c.env.UPLOADS.delete(up.storageKey);
      throw new ApiError(
        422,
        "upload.size_mismatch",
        "Uploaded size does not match the declared size",
      );
    }
    const obj = await c.env.UPLOADS.get(up.storageKey, {
      range: { offset: 0, length: SNIFF_BYTES },
    });
    const bytes = obj ? new Uint8Array(await obj.arrayBuffer()) : new Uint8Array();
    const detected = sniffMime(bytes, up.declaredMime);
    if (!detected || !isCompatible(up.declaredMime, detected)) {
      await c.env.UPLOADS.delete(up.storageKey);
      throw new ApiError(
        422,
        "upload.type_mismatch",
        "The file's contents don't match its declared type",
      );
    }
    const done = await uploadRepo.markCompleted(c.var.db, userId, up.id, {
      byteSize: head.size,
      detectedMime: detected,
      sha256: null, // computed by the ingestion pipeline (Phase 1), which reads the whole file anyway
    });
    if (!done) throw new ApiError(409, "upload.state_changed", "Upload state changed; retry");
    return c.json(toUpload(done), 200);
  });

/**
 * Worker-mode byte sink (UPLOAD_MODE=worker). Not part of the OpenAPI JSON surface:
 * it takes a raw body and streams it to R2 without buffering.
 */
export const uploadContentRouter = createRouter().put("/:id/content", async (c) => {
  if (c.var.config.uploadMode !== "worker") throw notFound("route");
  const up = await uploadRepo.get(c.var.db, c.var.user.id, c.req.param("id"));
  if (!up) throw notFound("upload");
  if (up.status !== "pending")
    throw new ApiError(409, "upload.already_completed", "Upload already completed");
  if (up.expiresAt.getTime() < Date.now())
    throw new ApiError(410, "upload.expired", "Upload ticket expired");
  const length = Number(c.req.header("content-length"));
  if (!Number.isFinite(length) || length !== up.declaredSize) {
    throw new ApiError(422, "upload.size_mismatch", "Content-Length must equal the declared size");
  }
  const body = c.req.raw.body;
  if (!body) throw new ApiError(422, "upload.empty", "Empty body");
  await c.env.UPLOADS.put(up.storageKey, body, { httpMetadata: { contentType: up.declaredMime } });
  return c.body(null, 204);
});
