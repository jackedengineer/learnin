import { profiles, schema } from "@doubtless/db";
import { Me, Profile, UpdateProfileInput } from "@doubtless/schemas";
import { createRoute } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { createRouter, errorResponses } from "../lib/openapi.ts";

const tags = ["Me"];

const toProfile = (p: Awaited<ReturnType<typeof profiles.get>>) => ({
  goals: p?.goals ?? null,
  level: p?.level ?? null,
  style: p?.style ?? null,
  isOnboarded: p?.isOnboarded ?? false,
  updatedAt: p?.updatedAt.toISOString() ?? null,
});

const getMe = createRoute({
  method: "get",
  path: "/",
  tags,
  summary: "The signed-in user and learner profile",
  responses: {
    200: { description: "Me", content: { "application/json": { schema: Me } } },
    ...errorResponses,
  },
});

const updateProfile = createRoute({
  method: "patch",
  path: "/profile",
  tags,
  summary: "Update the learner profile",
  request: {
    body: { required: true, content: { "application/json": { schema: UpdateProfileInput } } },
  },
  responses: {
    200: { description: "Profile", content: { "application/json": { schema: Profile } } },
    ...errorResponses,
  },
});

const deleteMe = createRoute({
  method: "delete",
  path: "/",
  tags,
  summary: "Delete the account and all of its data",
  responses: { 204: { description: "Deleted" }, ...errorResponses },
});

async function deletePrefix(bucket: R2Bucket, prefix: string) {
  let cursor: string | undefined;
  do {
    const page = await bucket.list({ prefix, cursor, limit: 1000 });
    if (page.objects.length) await bucket.delete(page.objects.map((o) => o.key));
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
}

export const meRouter = createRouter()
  .openapi(getMe, async (c) => {
    const u = c.var.user;
    const profile = await profiles.get(c.var.db, u.id);
    return c.json(
      {
        user: { id: u.id, name: u.name, email: u.email, image: u.image ?? null },
        profile: toProfile(profile),
      },
      200,
    );
  })
  .openapi(updateProfile, async (c) => {
    const p = await profiles.upsert(c.var.db, c.var.user.id, c.req.valid("json"));
    return c.json(toProfile(p), 200);
  })
  .openapi(deleteMe, async (c) => {
    const userId = c.var.user.id;
    // Blobs first (can be retried), then the user row; FK cascades remove everything else.
    // Phase 1 adds: Qdrant points by user_id filter.
    // Sign out first so this device's session + cached-session cookies are cleared in the response.
    // (Other devices' signed cookie caches expire within cookieCache.maxAge = 5 min.)
    const signOut = await c.var.auth.api.signOut({
      headers: c.req.raw.headers,
      returnHeaders: true,
    });
    for (const cookie of signOut.headers.getSetCookie())
      c.header("set-cookie", cookie, { append: true });
    await deletePrefix(c.env.UPLOADS, `uploads/${userId}/`);
    await deletePrefix(c.env.UPLOADS, `sources/${userId}/`);
    await c.var.db.delete(schema.users).where(eq(schema.users.id, userId));
    return c.body(null, 204);
  });
