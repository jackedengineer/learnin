import { z } from "@hono/zod-openapi";

export const Id = z.uuid().openapi({ example: "019a5b7e-3f2a-7c11-8d2e-5b9a1c3d4e5f" });
export const Timestamp = z.iso.datetime().openapi({ example: "2026-11-06T09:00:00.000Z" });

export const IdParam = z.object({ id: Id.openapi({ param: { name: "id", in: "path" } }) });

export const PaginationQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20).openapi({ example: 20 }),
  cursor: z
    .string()
    .max(200)
    .optional()
    .openapi({ description: "Opaque cursor from `nextCursor`" }),
});

export const page = <T extends z.ZodType>(item: T, name: string) =>
  z.object({ data: z.array(item), nextCursor: z.string().nullable() }).openapi(name);

/** RFC 9457 problem details (ADR-0001). */
export const Problem = z
  .object({
    type: z.string(),
    title: z.string(),
    status: z.number().int(),
    code: z.string().openapi({ example: "notebook.not_found" }),
    detail: z.string().optional(),
    instance: z.string().optional(),
    errors: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
  })
  .openapi("Problem");
export type Problem = z.infer<typeof Problem>;

export const IdempotencyHeader = z.object({
  "idempotency-key": z
    .string()
    .min(8)
    .max(255)
    .optional()
    .openapi({ description: "Client-generated once per intent; reuse on retry (ADR-0001)" }),
});
