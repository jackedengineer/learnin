/**
 * Error shapes safe to log. Database errors carry the full SQL and bound parameters
 * (user content, emails, session tokens) in `message`, so for those we log only
 * structural fields (ARCHITECTURE §9, "never log bodies or tokens").
 */
type PgLike = {
  code?: unknown;
  constraint_name?: unknown;
  table_name?: unknown;
  severity?: unknown;
};

function pgCause(err: unknown): PgLike | null {
  const cause = (err as { cause?: unknown } | null)?.cause;
  if (cause && typeof cause === "object" && typeof (cause as PgLike).code === "string")
    return cause as PgLike;
  if (
    err &&
    typeof err === "object" &&
    typeof (err as PgLike).code === "string" &&
    "severity" in err
  ) {
    return err as PgLike;
  }
  return null;
}

export function safeErrorForLog(err: unknown): Record<string, unknown> {
  const pg = pgCause(err);
  if (pg) {
    return {
      name: err instanceof Error ? err.name : "DatabaseError",
      pgCode: pg.code,
      constraint: pg.constraint_name,
      table: pg.table_name,
    };
  }
  if (err instanceof Error) {
    // First line only, bounded; stacks are file/line references, not data.
    return {
      name: err.name,
      message: err.message.split("\n")[0]?.slice(0, 200),
      stack: err.stack?.split("\n").slice(1, 6).join("\n"),
    };
  }
  return { name: typeof err };
}

/**
 * A foreign-key violation against users(id) means the account no longer exists while a
 * cached session cookie is still within its cache window — treat as signed out.
 */
export function isDeletedUserViolation(err: unknown): boolean {
  const pg = pgCause(err);
  return (
    pg?.code === "23503" &&
    typeof pg.constraint_name === "string" &&
    pg.constraint_name.includes("user_id_users_id_fk")
  );
}
