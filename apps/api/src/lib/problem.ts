import type { Problem } from "@doubtless/schemas";
import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

/** Throw anywhere in a handler; rendered as RFC 9457 problem+json (ADR-0001). */
export class ApiError extends Error {
  constructor(
    readonly status: ContentfulStatusCode,
    readonly code: string,
    readonly title: string,
    readonly detail?: string,
    readonly errors?: { path: string; message: string }[],
  ) {
    super(`${code}: ${title}`);
  }
}

export const notFound = (resource: string) =>
  new ApiError(
    404,
    `${resource}.not_found`,
    `${resource[0]?.toUpperCase()}${resource.slice(1)} not found`,
  );

export function problemResponse(c: Context, err: ApiError): Response {
  const body: Problem = {
    type: `https://doubtless.app/problems/${err.code}`,
    title: err.title,
    status: err.status,
    code: err.code,
    ...(err.detail ? { detail: err.detail } : {}),
    ...(err.errors ? { errors: err.errors } : {}),
    instance: c.get("requestId") as string | undefined,
  };
  return c.json(body, err.status, { "content-type": "application/problem+json" });
}

/** Zod issues → `errors[]` with dotted paths. */
export function zodIssuesToErrors(issues: { path: PropertyKey[]; message: string }[]) {
  return issues.map((i) => ({
    path: i.path.map(String).join(".") || "(root)",
    message: i.message,
  }));
}
