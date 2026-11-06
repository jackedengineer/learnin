import { useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { Button, ErrorState, Field, Input, Textarea } from "../components/ui.tsx";
import { useMe, useUpdateProfile } from "../lib/queries.ts";

export function WelcomePage() {
  const me = useMe();
  const update = useUpdateProfile();
  const navigate = useNavigate();
  const [goals, setGoals] = useState(me.data?.profile.goals ?? "");
  const [level, setLevel] = useState(me.data?.profile.level ?? "");

  const done = () => navigate({ to: "/" });
  function submit(e: FormEvent) {
    e.preventDefault();
    update.mutate(
      { goals: goals || null, level: level || null, isOnboarded: true },
      { onSuccess: done },
    );
  }

  const firstName = me.data?.user.name.split(" ")[0];
  return (
    <main className="mx-auto w-full max-w-lg px-4 py-12 sm:py-16">
      <h1 className="text-3xl">Welcome{firstName ? `, ${firstName}` : ""}.</h1>
      <p className="mt-2 text-ink-muted">
        Two quick questions so explanations land at your level. You can change these any time, and
        each notebook can override them.
      </p>
      <form onSubmit={submit} className="mt-8 space-y-5">
        <Field
          id="goals"
          label="What are you trying to learn, and why?"
          hint="e.g. “Understand transformers well enough to implement one.”"
        >
          <Textarea
            id="goals"
            rows={3}
            maxLength={2000}
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            aria-describedby="goals-hint"
          />
        </Field>
        <Field
          id="level"
          label="Your background"
          hint="e.g. “Comfortable with Python, rusty on linear algebra.”"
        >
          <Input
            id="level"
            maxLength={200}
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            aria-describedby="level-hint"
          />
        </Field>
        {update.error && <ErrorState message={update.error.message} />}
        <div className="flex items-center gap-3">
          <Button type="submit" busy={update.isPending}>
            Continue
          </Button>
          <Button
            variant="ghost"
            onClick={() => update.mutate({ isOnboarded: true }, { onSuccess: done })}
          >
            Skip for now
          </Button>
        </div>
      </form>
    </main>
  );
}
