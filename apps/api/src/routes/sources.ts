import { newId, notebookRepo, sourceRepo, uploadRepo } from "@doubtless/db";
import {
  CreateSourceInput,
  Id,
  IdempotencyHeader,
  IdParam,
  PaginationQuery,
  Source,
  SourcePage,
  UpdateSourceInput,
} from "@doubtless/schemas";
import { createRoute, z } from "@hono/zod-openapi";
import { idempotent } from "../lib/middleware.ts";
import { createRouter, errorResponses } from "../lib/openapi.ts";
import { ApiError, notFound } from "../lib/problem.ts";
import { toSource } from "../lib/serialize.ts";
import { kindForMime } from "../lib/storage.ts";
import { assertPublicHttpUrl, isYouTubeUrl } from "../lib/url-safety.ts";
import { parseCursor } from "./notebooks.ts";

const tags = ["Sources"];
const NotebookParam = z.object({
  notebookId: Id.openapi({ param: { name: "notebookId", in: "path" } }),
});

const listForNotebook = createRoute({
  method: "get",
  path: "/notebooks/{notebookId}/sources",
  tags,
  summary: "List a notebook's sources, newest first",
  request: { params: NotebookParam, query: PaginationQuery },
  responses: {
    200: {
      description: "A page of sources",
      content: { "application/json": { schema: SourcePage } },
    },
    ...errorResponses,
  },
});

const createForNotebook = createRoute({
  method: "post",
  path: "/notebooks/{notebookId}/sources",
  tags,
  summary: "Add a source (uploaded file, URL or pasted text). Processing starts asynchronously.",
  middleware: [idempotent] as const,
  request: {
    params: NotebookParam,
    headers: IdempotencyHeader,
    body: { required: true, content: { "application/json": { schema: CreateSourceInput } } },
  },
  responses: {
    201: {
      description: "Created (status `pending`)",
      content: { "application/json": { schema: Source } },
    },
    ...errorResponses,
  },
});

const get = createRoute({
  method: "get",
  path: "/sources/{id}",
  tags,
  summary: "Get a source",
  request: { params: IdParam },
  responses: {
    200: { description: "The source", content: { "application/json": { schema: Source } } },
    ...errorResponses,
  },
});

const update = createRoute({
  method: "patch",
  path: "/sources/{id}",
  tags,
  summary: "Update a source (title, selection, priority)",
  request: {
    params: IdParam,
    body: { required: true, content: { "application/json": { schema: UpdateSourceInput } } },
  },
  responses: {
    200: { description: "Updated", content: { "application/json": { schema: Source } } },
    ...errorResponses,
  },
});

const remove = createRoute({
  method: "delete",
  path: "/sources/{id}",
  tags,
  summary: "Delete a source",
  request: { params: IdParam },
  responses: { 204: { description: "Deleted" }, ...errorResponses },
});

const titleFromUrl = (u: URL) =>
  `${u.hostname}${u.pathname === "/" ? "" : u.pathname}`.slice(0, 300);

export const sourcesRouter = createRouter()
  .openapi(listForNotebook, async (c) => {
    const { notebookId } = c.req.valid("param");
    const { limit, cursor } = c.req.valid("query");
    if (!(await notebookRepo.get(c.var.db, c.var.user.id, notebookId))) throw notFound("notebook");
    const page = await sourceRepo.list(c.var.db, c.var.user.id, notebookId, {
      limit,
      cursor: parseCursor(cursor),
    });
    return c.json({ data: page.items.map(toSource), nextCursor: page.nextCursor }, 200);
  })
  .openapi(createForNotebook, async (c) => {
    const userId = c.var.user.id;
    const { notebookId } = c.req.valid("param");
    const input = c.req.valid("json");
    if (!(await notebookRepo.get(c.var.db, userId, notebookId))) throw notFound("notebook");

    let source: Awaited<ReturnType<typeof sourceRepo.create>>;
    if (input.type === "url") {
      const url = assertPublicHttpUrl(input.url);
      source = await sourceRepo.create(c.var.db, userId, {
        notebookId,
        kind: isYouTubeUrl(url) ? "youtube" : "web",
        title: input.title ?? titleFromUrl(url),
        originUrl: url.toString(),
        addedVia: "url",
      });
    } else if (input.type === "text") {
      const storageKey = `sources/${userId}/${newId()}.txt`;
      const bytes = new TextEncoder().encode(input.text);
      await c.env.UPLOADS.put(storageKey, bytes, {
        httpMetadata: { contentType: "text/plain; charset=utf-8" },
      });
      source = await sourceRepo.create(c.var.db, userId, {
        notebookId,
        kind: "text",
        title: input.title,
        storageKey,
        mime: "text/plain",
        byteSize: bytes.byteLength,
        addedVia: "paste",
      });
    } else {
      const upload = await uploadRepo.consume(c.var.db, userId, input.uploadId);
      if (!upload) {
        const existing = await uploadRepo.get(c.var.db, userId, input.uploadId);
        if (!existing) throw notFound("upload");
        throw new ApiError(
          409,
          "upload.not_available",
          "Upload is not completed or was already used",
        );
      }
      const mime = upload.detectedMime ?? upload.declaredMime;
      const kind = kindForMime(mime);
      if (!kind) throw new ApiError(422, "source.unsupported_type", "Unsupported file type");
      source = await sourceRepo.create(c.var.db, userId, {
        notebookId,
        kind,
        title: input.title ?? upload.filename,
        uploadId: upload.id,
        storageKey: upload.storageKey,
        mime,
        byteSize: upload.byteSize,
        addedVia: "upload",
      });
    }
    // Phase 1: start the IngestSource workflow here (ARCHITECTURE §4.1).
    return c.json(toSource(source), 201, { location: `/v1/sources/${source.id}` });
  })
  .openapi(get, async (c) => {
    const s = await sourceRepo.get(c.var.db, c.var.user.id, c.req.valid("param").id);
    if (!s) throw notFound("source");
    return c.json(toSource(s), 200);
  })
  .openapi(update, async (c) => {
    const s = await sourceRepo.update(
      c.var.db,
      c.var.user.id,
      c.req.valid("param").id,
      c.req.valid("json"),
    );
    if (!s) throw notFound("source");
    return c.json(toSource(s), 200);
  })
  .openapi(remove, async (c) => {
    const ok = await sourceRepo.softDelete(c.var.db, c.var.user.id, c.req.valid("param").id);
    if (!ok) throw notFound("source");
    return c.body(null, 204);
  });
