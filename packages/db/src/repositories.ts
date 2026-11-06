/**
 * Tenant-scoped data access. Every function takes `userId` and applies the
 * soft-delete filter, so callers can't forget either (ADR-0002).
 */
import { and, desc, eq, isNull, lt, or, sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import type { Executor } from "./client.ts";
import { newId } from "./ids.ts";
import { type Cursor, type Page, toPage } from "./pagination.ts";
import {
  idempotencyKeys,
  type LearnerProfile,
  learnerProfiles,
  type NewSource,
  type Notebook,
  notebooks,
  type Source,
  sources,
  type Upload,
  uploads,
} from "./schema.ts";

const afterCursor = (col: { createdAt: AnyPgColumn; id: AnyPgColumn }, c: Cursor | null) =>
  c
    ? or(lt(col.createdAt, c.createdAt), and(eq(col.createdAt, c.createdAt), lt(col.id, c.id)))
    : undefined;

/* ─────────────────────────────── Profiles ─────────────────────────────── */

export const profiles = {
  async get(db: Executor, userId: string): Promise<LearnerProfile | null> {
    const [row] = await db.select().from(learnerProfiles).where(eq(learnerProfiles.userId, userId));
    return row ?? null;
  },

  async upsert(
    db: Executor,
    userId: string,
    patch: Partial<Pick<LearnerProfile, "goals" | "level" | "style" | "isOnboarded">>,
  ): Promise<LearnerProfile> {
    const [row] = await db
      .insert(learnerProfiles)
      .values({ userId, ...patch })
      .onConflictDoUpdate({
        target: learnerProfiles.userId,
        set: { ...patch, updatedAt: sql`now()` },
      })
      .returning();
    if (!row) throw new Error("profile upsert returned no row");
    return row;
  },
};

/* ─────────────────────────────── Notebooks ─────────────────────────────── */

export type NotebookPatch = Partial<
  Pick<Notebook, "title" | "goals" | "level" | "answerMode" | "answerLength" | "customInstructions">
>;

export const notebookRepo = {
  async list(
    db: Executor,
    userId: string,
    opts: { limit: number; cursor: Cursor | null },
  ): Promise<Page<Notebook>> {
    const rows = await db
      .select()
      .from(notebooks)
      .where(
        and(
          eq(notebooks.userId, userId),
          isNull(notebooks.deletedAt),
          afterCursor(notebooks, opts.cursor),
        ),
      )
      .orderBy(desc(notebooks.createdAt), desc(notebooks.id))
      .limit(opts.limit + 1);
    return toPage(rows, opts.limit);
  },

  async get(db: Executor, userId: string, id: string): Promise<Notebook | null> {
    const [row] = await db
      .select()
      .from(notebooks)
      .where(and(eq(notebooks.id, id), eq(notebooks.userId, userId), isNull(notebooks.deletedAt)));
    return row ?? null;
  },

  async create(
    db: Executor,
    userId: string,
    input: { title: string } & NotebookPatch,
  ): Promise<Notebook> {
    const [row] = await db
      .insert(notebooks)
      .values({ id: newId(), userId, ...input })
      .returning();
    if (!row) throw new Error("notebook insert returned no row");
    return row;
  },

  async update(
    db: Executor,
    userId: string,
    id: string,
    patch: NotebookPatch,
  ): Promise<Notebook | null> {
    const [row] = await db
      .update(notebooks)
      .set({ ...patch, updatedAt: sql`now()` })
      .where(and(eq(notebooks.id, id), eq(notebooks.userId, userId), isNull(notebooks.deletedAt)))
      .returning();
    return row ?? null;
  },

  /**
   * Lock a live notebook row FOR SHARE inside a transaction, so a concurrent soft delete
   * can't commit between "notebook exists" and inserting a child row.
   */
  async lockLive(tx: Executor, userId: string, id: string): Promise<boolean> {
    const rows = await tx
      .select({ id: notebooks.id })
      .from(notebooks)
      .where(and(eq(notebooks.id, id), eq(notebooks.userId, userId), isNull(notebooks.deletedAt)))
      .for("share");
    return rows.length > 0;
  },

  /** Soft delete. Returns false if not found (or already deleted). */
  async softDelete(db: Executor, userId: string, id: string): Promise<boolean> {
    return db.transaction(async (tx) => {
      const rows = await tx
        .update(notebooks)
        .set({ deletedAt: sql`now()`, updatedAt: sql`now()` })
        .where(and(eq(notebooks.id, id), eq(notebooks.userId, userId), isNull(notebooks.deletedAt)))
        .returning({ id: notebooks.id });
      if (rows.length === 0) return false;
      await tx
        .update(sources)
        .set({ deletedAt: sql`now()`, updatedAt: sql`now()` })
        .where(
          and(eq(sources.notebookId, id), eq(sources.userId, userId), isNull(sources.deletedAt)),
        );
      return true;
    });
  },
};

/* ──────────────────────────────── Uploads ──────────────────────────────── */

export const uploadRepo = {
  async create(
    db: Executor,
    userId: string,
    input: { filename: string; declaredMime: string; declaredSize: number; expiresAt: Date },
  ): Promise<Upload> {
    const id = newId();
    const [row] = await db
      .insert(uploads)
      .values({ id, userId, storageKey: `uploads/${userId}/${id}`, ...input })
      .returning();
    if (!row) throw new Error("upload insert returned no row");
    return row;
  },

  async get(db: Executor, userId: string, id: string): Promise<Upload | null> {
    const [row] = await db
      .select()
      .from(uploads)
      .where(and(eq(uploads.id, id), eq(uploads.userId, userId)));
    return row ?? null;
  },

  async markCompleted(
    db: Executor,
    userId: string,
    id: string,
    facts: { byteSize: number; detectedMime: string; sha256: string | null; etag: string },
  ): Promise<Upload | null> {
    const [row] = await db
      .update(uploads)
      .set({ ...facts, status: "completed", updatedAt: sql`now()` })
      .where(and(eq(uploads.id, id), eq(uploads.userId, userId), eq(uploads.status, "pending")))
      .returning();
    return row ?? null;
  },

  /** Pending (not yet completed) uploads started in the last hour — for abuse limits. */
  async countRecentPending(db: Executor, userId: string): Promise<number> {
    const [row] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(uploads)
      .where(
        and(
          eq(uploads.userId, userId),
          eq(uploads.status, "pending"),
          sql`${uploads.createdAt} > now() - interval '1 hour'`,
        ),
      );
    return row?.n ?? 0;
  },

  /** Atomically consume a completed upload so it can back exactly one source. */
  async consume(db: Executor, userId: string, id: string): Promise<Upload | null> {
    const [row] = await db
      .update(uploads)
      .set({ status: "consumed", updatedAt: sql`now()` })
      .where(and(eq(uploads.id, id), eq(uploads.userId, userId), eq(uploads.status, "completed")))
      .returning();
    return row ?? null;
  },
};

/* ──────────────────────────────── Sources ──────────────────────────────── */

export const sourceRepo = {
  async list(
    db: Executor,
    userId: string,
    notebookId: string,
    opts: { limit: number; cursor: Cursor | null },
  ): Promise<Page<Source>> {
    const rows = await db
      .select()
      .from(sources)
      .where(
        and(
          eq(sources.userId, userId),
          eq(sources.notebookId, notebookId),
          isNull(sources.deletedAt),
          afterCursor(sources, opts.cursor),
        ),
      )
      .orderBy(desc(sources.createdAt), desc(sources.id))
      .limit(opts.limit + 1);
    return toPage(rows, opts.limit);
  },

  async get(db: Executor, userId: string, id: string): Promise<Source | null> {
    const [row] = await db
      .select()
      .from(sources)
      .where(and(eq(sources.id, id), eq(sources.userId, userId), isNull(sources.deletedAt)));
    return row ?? null;
  },

  async create(
    db: Executor,
    userId: string,
    input: Omit<NewSource, "id" | "userId" | "createdAt" | "updatedAt" | "deletedAt">,
  ): Promise<Source> {
    const [row] = await db
      .insert(sources)
      .values({ id: newId(), userId, ...input })
      .returning();
    if (!row) throw new Error("source insert returned no row");
    return row;
  },

  async update(
    db: Executor,
    userId: string,
    id: string,
    patch: Partial<Pick<Source, "title" | "isSelected" | "priority">>,
  ): Promise<Source | null> {
    const [row] = await db
      .update(sources)
      .set({ ...patch, updatedAt: sql`now()` })
      .where(and(eq(sources.id, id), eq(sources.userId, userId), isNull(sources.deletedAt)))
      .returning();
    return row ?? null;
  },

  async softDelete(db: Executor, userId: string, id: string): Promise<boolean> {
    const rows = await db
      .update(sources)
      .set({ deletedAt: sql`now()`, updatedAt: sql`now()` })
      .where(and(eq(sources.id, id), eq(sources.userId, userId), isNull(sources.deletedAt)))
      .returning({ id: sources.id });
    return rows.length > 0;
  },
};

/* ───────────────────────────── Idempotency ───────────────────────────── */

export type IdempotencyRecord = typeof idempotencyKeys.$inferSelect;

export const idempotencyRepo = {
  /**
   * Atomic claim: the unique (user_id, key) constraint picks the winner.
   * Returns `claimed: true` for the first caller, otherwise the existing record.
   * Expired records are deleted first so the key can be reused after its TTL, and
   * `in_progress` claims older than the lease (a crashed request) are reclaimable.
   */
  async claim(
    db: Executor,
    userId: string,
    input: {
      key: string;
      method: string;
      path: string;
      requestHash: string;
      ttlSeconds: number;
      leaseSeconds?: number;
    },
  ): Promise<{ claimed: true } | { claimed: false; existing: IdempotencyRecord }> {
    await db
      .delete(idempotencyKeys)
      .where(
        and(
          eq(idempotencyKeys.userId, userId),
          eq(idempotencyKeys.key, input.key),
          or(
            lt(idempotencyKeys.expiresAt, sql`now()`),
            and(
              eq(idempotencyKeys.state, "in_progress"),
              lt(
                idempotencyKeys.createdAt,
                sql`now() - make_interval(secs => ${input.leaseSeconds ?? 60})`,
              ),
            ),
          ),
        ),
      );
    const inserted = await db
      .insert(idempotencyKeys)
      .values({
        userId,
        key: input.key,
        method: input.method,
        path: input.path,
        requestHash: input.requestHash,
        expiresAt: sql`now() + make_interval(secs => ${input.ttlSeconds})`,
      })
      .onConflictDoNothing()
      .returning({ key: idempotencyKeys.key });
    if (inserted.length > 0) return { claimed: true };
    const [existing] = await db
      .select()
      .from(idempotencyKeys)
      .where(and(eq(idempotencyKeys.userId, userId), eq(idempotencyKeys.key, input.key)));
    if (!existing) throw new Error("idempotency claim lost and record vanished");
    return { claimed: false, existing };
  },

  async complete(
    db: Executor,
    userId: string,
    key: string,
    response: { status: number; body: unknown; headers: Record<string, string> },
  ): Promise<void> {
    await db
      .update(idempotencyKeys)
      .set({
        state: "completed",
        responseStatus: response.status,
        responseBody: response.body,
        responseHeaders: response.headers,
      })
      .where(and(eq(idempotencyKeys.userId, userId), eq(idempotencyKeys.key, key)));
  },

  /** Release a claim when the handler failed, so the client can retry. */
  async release(db: Executor, userId: string, key: string): Promise<void> {
    await db
      .delete(idempotencyKeys)
      .where(
        and(
          eq(idempotencyKeys.userId, userId),
          eq(idempotencyKeys.key, key),
          eq(idempotencyKeys.state, "in_progress"),
        ),
      );
  },
};
