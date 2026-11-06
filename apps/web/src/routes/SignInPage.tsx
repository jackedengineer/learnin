import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { Button, ErrorState, Field, Input } from "../components/ui.tsx";
import { Wordmark } from "../components/Wordmark.tsx";
import { authClient, devLoginEnabled } from "../lib/auth.ts";
import { keys } from "../lib/queries.ts";

function GoogleMark() {
  return (
    <svg viewBox="0 0 18 18" className="size-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}

export function SignInPage() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function google() {
    setBusy(true);
    setError(null);
    const res = await authClient.signIn.social({ provider: "google", callbackURL: "/" });
    if (res.error) {
      setBusy(false);
      setError(
        res.error.status === 404
          ? "Google sign-in isn't configured on this server yet."
          : (res.error.message ?? "Sign-in failed. Please try again."),
      );
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm">
        <Wordmark className="text-3xl" />
        <h1 className="mt-6 text-2xl leading-snug">
          Ask your doubts. Get answers from your own sources.
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Bring your papers, lectures and notes. Every answer cites the exact page or moment it came
          from.
        </p>
        <div className="mt-8 space-y-3">
          <Button variant="secondary" className="w-full" onClick={google} busy={busy}>
            {!busy && <GoogleMark />}
            Continue with Google
          </Button>
          {error && <ErrorState message={error} />}
        </div>
        {devLoginEnabled && <DevLogin />}
      </div>
    </main>
  );
}

/** Local development only (server refuses this in production). */
function DevLogin() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [email, setEmail] = useState("dev@example.com");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const password = "dev-password-123";
    const signIn = await authClient.signIn.email({ email, password });
    const error = signIn.error
      ? (await authClient.signUp.email({ email, password, name: email.split("@")[0] ?? "Dev" }))
          .error
      : null;
    setBusy(false);
    if (error) return setError(error.message ?? "Dev login failed");
    await qc.invalidateQueries({ queryKey: keys.me });
    navigate({ to: "/" });
  }

  return (
    <form
      onSubmit={submit}
      className="mt-10 space-y-3 rounded-lg border border-dashed border-rule-strong p-4"
      aria-label="Developer login"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-warning">
        Local development only
      </p>
      <Field id="dev-email" label="Dev email">
        <Input
          id="dev-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </Field>
      <Button type="submit" variant="ghost" size="sm" busy={busy}>
        Dev sign in
      </Button>
      {error && <ErrorState message={error} />}
    </form>
  );
}
