import { useQueryClient } from "@tanstack/react-query";
import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { Wordmark } from "../components/Wordmark.tsx";
import { authClient } from "../lib/auth.ts";
import { useMe } from "../lib/queries.ts";

export function AppShell() {
  const me = useMe();
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function signOut() {
    await authClient.signOut();
    qc.clear();
    navigate({ to: "/sign-in" });
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 border-b border-rule bg-paper/90 backdrop-blur">
        <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" aria-label="Doubtless home">
            <Wordmark />
          </Link>
          {me.data && (
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-ink-muted sm:inline">{me.data.user.email}</span>
              {me.data.user.image ? (
                <img
                  src={me.data.user.image}
                  alt=""
                  className="size-7 rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span
                  aria-hidden
                  className="grid size-7 place-items-center rounded-full bg-accent-soft text-xs font-medium text-accent"
                >
                  {me.data.user.name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <button
                type="button"
                onClick={signOut}
                className="text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>
      <Outlet />
    </div>
  );
}
