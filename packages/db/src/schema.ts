/**
 * Postgres schema — conventions in docs/adr/0002-database-design.md.
 * snake_case plural tables, UUIDv7 ids generated in the app, user_id on every
 * user-owned row, timestamptz everywhere, soft delete on user-facing aggregates.
 */
import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

/* ───────────────────────────── Auth (Better Auth) ───────────────────────────── */
// Field keys must match Better Auth's model fields; column names follow our conventions.

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("sessions_user_id_idx").on(t.userId)],
);

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"), // unused (Google-only); dev-login only in local development
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("accounts_user_id_idx").on(t.userId),
    uniqueIndex("accounts_provider_id_account_id_key").on(t.providerId, t.accountId),
  ],
);

export const verifications = pgTable(
  "verifications",
  {
    id: uuid("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("verifications_identifier_idx").on(t.identifier)],
);

/* ───────────────────────────────── Learner ───────────────────────────────── */

export const learnerProfiles = pgTable(
  "learner_profiles",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    goals: text("goals"),
    level: text("level"),
    style: text("style"),
    isOnboarded: boolean("is_onboarded").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check("learner_profiles_goals_len", sql`char_length(${t.goals}) <= 2000`),
    check("learner_profiles_level_len", sql`char_length(${t.level}) <= 200`),
    check("learner_profiles_style_len", sql`char_length(${t.style}) <= 2000`),
  ],
);

/* ──────────────────────────────── Notebooks ──────────────────────────────── */

export const answerModeEnum = pgEnum("answer_mode", ["default", "tutor", "custom"]);
export const answerLengthEnum = pgEnum("answer_length", ["shorter", "default", "longer"]);

export const notebooks = pgTable(
  "notebooks",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    goals: text("goals"),
    level: text("level"),
    answerMode: answerModeEnum("answer_mode").notNull().default("default"),
    answerLength: answerLengthEnum("answer_length").notNull().default("default"),
    customInstructions: text("custom_instructions"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    // List query: newest first per user, live rows only.
    index("notebooks_user_id_created_at_idx")
      .on(t.userId, t.createdAt.desc(), t.id.desc())
      .where(sql`${t.deletedAt} IS NULL`),
    check("notebooks_title_len", sql`char_length(${t.title}) BETWEEN 1 AND 200`),
    check("notebooks_goals_len", sql`char_length(${t.goals}) <= 2000`),
    check("notebooks_level_len", sql`char_length(${t.level}) <= 200`),
    check("notebooks_custom_instructions_len", sql`char_length(${t.customInstructions}) <= 10000`),
  ],
);

/* ───────────────────────────────── Uploads ───────────────────────────────── */

export const uploadStatusEnum = pgEnum("upload_status", ["pending", "completed", "consumed"]);

export const uploads = pgTable(
  "uploads",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    storageKey: text("storage_key").notNull().unique(),
    filename: text("filename").notNull(),
    declaredMime: text("declared_mime").notNull(),
    detectedMime: text("detected_mime"),
    declaredSize: bigint("declared_size", { mode: "number" }).notNull(),
    byteSize: bigint("byte_size", { mode: "number" }),
    sha256: text("sha256"),
    status: uploadStatusEnum("status").notNull().default("pending"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("uploads_user_id_status_idx").on(t.userId, t.status),
    check("uploads_declared_size_positive", sql`${t.declaredSize} > 0`),
    check("uploads_filename_len", sql`char_length(${t.filename}) BETWEEN 1 AND 255`),
  ],
);

/* ───────────────────────────────── Sources ───────────────────────────────── */

export const sourceKindEnum = pgEnum("source_kind", [
  "pdf",
  "image",
  "video",
  "audio",
  "transcript",
  "youtube",
  "web",
  "text",
  "docx",
]);
export const sourceStatusEnum = pgEnum("source_status", [
  "pending",
  "processing",
  "ready",
  "partial",
  "failed",
]);

export const sources = pgTable(
  "sources",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    notebookId: uuid("notebook_id")
      .notNull()
      .references(() => notebooks.id, { onDelete: "cascade" }),
    kind: sourceKindEnum("kind").notNull(),
    title: text("title").notNull(),
    originUrl: text("origin_url"),
    uploadId: uuid("upload_id").references(() => uploads.id, { onDelete: "set null" }),
    storageKey: text("storage_key"),
    mime: text("mime"),
    byteSize: bigint("byte_size", { mode: "number" }),
    contentSha256: text("content_sha256"),
    status: sourceStatusEnum("status").notNull().default("pending"),
    error: jsonb("error").$type<{ code: string; message: string } | null>(),
    pipelineVersion: integer("pipeline_version").notNull().default(1),
    priority: smallint("priority").notNull().default(0),
    isSelected: boolean("is_selected").notNull().default(true),
    addedVia: text("added_via").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    // FK lookups for cascades (notebook hard-delete, upload set-null).
    index("sources_notebook_id_idx").on(t.notebookId),
    index("sources_upload_id_idx").on(t.uploadId),
    index("sources_user_id_notebook_id_created_at_idx")
      .on(t.userId, t.notebookId, t.createdAt.desc(), t.id.desc())
      .where(sql`${t.deletedAt} IS NULL`),
    check("sources_title_len", sql`char_length(${t.title}) BETWEEN 1 AND 300`),
    check(
      "sources_added_via_valid",
      sql`${t.addedVia} IN ('upload','url','discovery','share_sheet','paste')`,
    ),
    check(
      "sources_origin_or_storage",
      sql`${t.originUrl} IS NOT NULL OR ${t.storageKey} IS NOT NULL`,
    ),
  ],
);

/* ───────────────────────────── Idempotency keys ───────────────────────────── */

export const idempotencyStateEnum = pgEnum("idempotency_state", ["in_progress", "completed"]);

export const idempotencyKeys = pgTable(
  "idempotency_keys",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    method: text("method").notNull(),
    path: text("path").notNull(),
    requestHash: text("request_hash").notNull(),
    state: idempotencyStateEnum("state").notNull().default("in_progress"),
    responseStatus: smallint("response_status"),
    responseBody: jsonb("response_body"),
    responseHeaders: jsonb("response_headers").$type<Record<string, string>>(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    // The unique constraint IS the claim mechanism (ADR-0001).
    uniqueIndex("idempotency_keys_user_id_key_key").on(t.userId, t.key),
    index("idempotency_keys_expires_at_idx").on(t.expiresAt),
    check("idempotency_keys_key_len", sql`char_length(${t.key}) BETWEEN 8 AND 255`),
  ],
);

export type User = typeof users.$inferSelect;
export type LearnerProfile = typeof learnerProfiles.$inferSelect;
export type Notebook = typeof notebooks.$inferSelect;
export type NewNotebook = typeof notebooks.$inferInsert;
export type Upload = typeof uploads.$inferSelect;
export type Source = typeof sources.$inferSelect;
export type NewSource = typeof sources.$inferInsert;
export type SourceKind = (typeof sourceKindEnum.enumValues)[number];
export type SourceStatus = (typeof sourceStatusEnum.enumValues)[number];
