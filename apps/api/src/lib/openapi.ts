import { Problem } from "@doubtless/schemas";
import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppEnv } from "./context.ts";
import { ApiError, zodIssuesToErrors } from "./problem.ts";

/** Every sub-app shares one validation behaviour: 422 problem+json with field errors. */
export const createRouter = () =>
  new OpenAPIHono<AppEnv>({
    defaultHook: (result) => {
      if (!result.success) {
        throw new ApiError(
          422,
          "validation.failed",
          "Request validation failed",
          undefined,
          zodIssuesToErrors(result.error.issues),
        );
      }
    },
  });

const problem = (description: string) => ({
  description,
  content: { "application/problem+json": { schema: Problem } },
});

export const errorResponses = {
  401: problem("Not signed in"),
  404: problem("Not found"),
  409: problem("Conflict"),
  422: problem("Validation failed"),
} as const;
