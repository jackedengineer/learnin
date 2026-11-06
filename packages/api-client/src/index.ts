import type { AppType } from "@doubtless/api/types";
import type { Problem } from "@doubtless/schemas";
import { hc } from "hono/client";

/** Typed client generated from the API's routes (ADR-0001). Same code on web and mobile. */
export function createApiClient(
  baseUrl: string,
  init: { fetch?: typeof fetch; headers?: () => Record<string, string> } = {},
) {
  return hc<AppType>(baseUrl, {
    fetch:
      init.fetch ??
      ((input: RequestInfo | URL, reqInit?: RequestInit) =>
        fetch(input, { credentials: "include", ...reqInit })),
    headers: init.headers,
  });
}

export type ApiClient = ReturnType<typeof createApiClient>;

/** A problem+json error surfaced to UI code with its stable `code`. */
export class ApiProblemError extends Error {
  constructor(readonly problem: Problem) {
    super(problem.detail ?? problem.title);
    this.name = "ApiProblemError";
  }
  get code() {
    return this.problem.code;
  }
  get status() {
    return this.problem.status;
  }
}

/** Throw ApiProblemError for non-2xx; return typed JSON (or undefined for 204). */
export async function unwrap<T>(
  res: { ok: boolean; status: number; json(): Promise<T> } | Response,
): Promise<T> {
  if (res.ok) return (res.status === 204 ? undefined : await res.json()) as T;
  let problem: Problem;
  try {
    problem = (await res.json()) as Problem;
  } catch {
    problem = {
      type: "about:blank",
      title: `HTTP ${res.status}`,
      status: res.status,
      code: `http.${res.status}`,
    };
  }
  throw new ApiProblemError(problem);
}

/** One key per user intent; reuse it when retrying the same action (ADR-0001). */
export const newIdempotencyKey = () => crypto.randomUUID();
