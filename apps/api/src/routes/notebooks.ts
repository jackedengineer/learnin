import { decodeCursor, notebookRepo } from "@doubtless/db";
import {
  CreateNotebookInput,
  IdempotencyHeader,
  IdParam,
  Notebook,
  NotebookPage,
  PaginationQuery,
  UpdateNotebookInput,
} from "@doubtless/schemas";
import { createRoute } from "@hono/zod-openapi";
import { idempotent } from "../lib/middleware.ts";
import { createRouter, errorResponses } from "../lib/openapi.ts";
import { ApiError, notFound } from "../lib/problem.ts";
import { toNotebook } from "../lib/serialize.ts";

const tags = ["Notebooks"];

export const parseCursor = (raw: string | undefined) => {
  if (!raw) return null;
  const c = decodeCursor(raw);
  if (!c) throw new ApiError(422, "pagination.invalid_cursor", "Invalid cursor");
  return c;
};

const list = createRoute({
  method: "get",
  path: "/",
  tags,
  summary: "List notebooks, newest first",
  request: { query: PaginationQuery },
  responses: {
    200: {
      description: "A page of notebooks",
      content: { "application/json": { schema: NotebookPage } },
    },
    ...errorResponses,
  },
});

const create = createRoute({
  method: "post",
  path: "/",
  tags,
  summary: "Create a notebook",
  middleware: [idempotent] as const,
  request: {
    headers: IdempotencyHeader,
    body: { required: true, content: { "application/json": { schema: CreateNotebookInput } } },
  },
  responses: {
    201: { description: "Created", content: { "application/json": { schema: Notebook } } },
    ...errorResponses,
  },
});

const get = createRoute({
  method: "get",
  path: "/{id}",
  tags,
  summary: "Get a notebook",
  request: { params: IdParam },
  responses: {
    200: { description: "The notebook", content: { "application/json": { schema: Notebook } } },
    ...errorResponses,
  },
});

const update = createRoute({
  method: "patch",
  path: "/{id}",
  tags,
  summary: "Update a notebook (partial)",
  request: {
    params: IdParam,
    body: { required: true, content: { "application/json": { schema: UpdateNotebookInput } } },
  },
  responses: {
    200: { description: "Updated", content: { "application/json": { schema: Notebook } } },
    ...errorResponses,
  },
});

const remove = createRoute({
  method: "delete",
  path: "/{id}",
  tags,
  summary: "Delete a notebook (and its sources)",
  request: { params: IdParam },
  responses: { 204: { description: "Deleted" }, ...errorResponses },
});

export const notebooksRouter = createRouter()
  .openapi(list, async (c) => {
    const { limit, cursor } = c.req.valid("query");
    const page = await notebookRepo.list(c.var.db, c.var.user.id, {
      limit,
      cursor: parseCursor(cursor),
    });
    return c.json({ data: page.items.map(toNotebook), nextCursor: page.nextCursor }, 200);
  })
  .openapi(create, async (c) => {
    const input = c.req.valid("json");
    const nb = await notebookRepo.create(c.var.db, c.var.user.id, input);
    return c.json(toNotebook(nb), 201, { location: `/v1/notebooks/${nb.id}` });
  })
  .openapi(get, async (c) => {
    const nb = await notebookRepo.get(c.var.db, c.var.user.id, c.req.valid("param").id);
    if (!nb) throw notFound("notebook");
    return c.json(toNotebook(nb), 200);
  })
  .openapi(update, async (c) => {
    const nb = await notebookRepo.update(
      c.var.db,
      c.var.user.id,
      c.req.valid("param").id,
      c.req.valid("json"),
    );
    if (!nb) throw notFound("notebook");
    return c.json(toNotebook(nb), 200);
  })
  .openapi(remove, async (c) => {
    const ok = await notebookRepo.softDelete(c.var.db, c.var.user.id, c.req.valid("param").id);
    if (!ok) throw notFound("notebook");
    return c.body(null, 204);
  });
