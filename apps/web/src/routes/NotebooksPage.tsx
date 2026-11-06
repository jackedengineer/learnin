import type { Notebook } from "@doubtless/schemas";
import { Link, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { Dialog } from "../components/Dialog.tsx";
import { Button, EmptyState, ErrorState, Field, Input, Skeleton } from "../components/ui.tsx";
import { newIdempotencyKey, useCreateNotebook, useNotebooks } from "../lib/queries.ts";

const dateFmt = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function NotebooksPage() {
  const notebooks = useNotebooks();
  const [creating, setCreating] = useState(false);
  const items = notebooks.data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">Your notebooks</h1>
          <p className="mt-1 text-sm text-ink-muted">One notebook per subject you're studying.</p>
        </div>
        <Button onClick={() => setCreating(true)}>New notebook</Button>
      </div>

      <section className="mt-8" aria-label="Notebooks" aria-busy={notebooks.isLoading}>
        {notebooks.isLoading && (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        )}
        {notebooks.error && (
          <ErrorState message="Couldn't load your notebooks." onRetry={() => notebooks.refetch()} />
        )}
        {notebooks.isSuccess && items.length === 0 && (
          <EmptyState
            title="No notebooks yet"
            body="Create one for the subject you're learning, then add your PDFs, lectures and links."
            action={<Button onClick={() => setCreating(true)}>Create your first notebook</Button>}
          />
        )}
        {items.length > 0 && (
          <ul className="divide-y divide-rule overflow-hidden rounded-lg border border-rule bg-surface">
            {items.map((nb) => (
              <NotebookRow key={nb.id} nb={nb} />
            ))}
          </ul>
        )}
        {notebooks.hasNextPage && (
          <Button
            variant="ghost"
            className="mt-3"
            onClick={() => notebooks.fetchNextPage()}
            busy={notebooks.isFetchingNextPage}
          >
            Load more
          </Button>
        )}
      </section>

      <CreateNotebookDialog open={creating} onClose={() => setCreating(false)} />
    </main>
  );
}

function NotebookRow({ nb }: { nb: Notebook }) {
  return (
    <li>
      <Link
        to="/notebooks/$notebookId"
        params={{ notebookId: nb.id }}
        className="flex items-center justify-between gap-4 px-4 py-3.5 hover:bg-sunken focus-visible:bg-sunken"
      >
        <div className="min-w-0">
          <p className="truncate font-serif text-lg text-ink">{nb.title}</p>
          {nb.level && <p className="truncate text-sm text-ink-muted">{nb.level}</p>}
        </div>
        <time dateTime={nb.updatedAt} className="shrink-0 text-xs text-ink-faint">
          {dateFmt.format(new Date(nb.updatedAt))}
        </time>
      </Link>
    </li>
  );
}

function CreateNotebookDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateNotebook();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  // One key per creation intent: retries of this submit reuse it; a new notebook gets a new one.
  const [key, setKey] = useState(newIdempotencyKey);

  function submit(e: FormEvent) {
    e.preventDefault();
    create.mutate(
      { json: { title }, key },
      {
        onSuccess: (nb) => {
          setKey(newIdempotencyKey());
          setTitle("");
          onClose();
          navigate({ to: "/notebooks/$notebookId", params: { notebookId: nb.id } });
        },
      },
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New notebook"
      description="Name it after what you're learning."
    >
      <form onSubmit={submit} className="space-y-4">
        <Field id="nb-title" label="Title">
          <Input
            id="nb-title"
            autoFocus
            required
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Transformers from scratch"
          />
        </Field>
        {create.error && <ErrorState message={create.error.message} />}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" busy={create.isPending} disabled={!title.trim()}>
            Create
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
