import type { Source, SourceKind, SourceStatus } from "@doubtless/schemas";
import { useState } from "react";
import { useDeleteSource, useSources, useUpdateSource } from "../../lib/queries.ts";
import { Button, cx, EmptyState, ErrorState, Skeleton } from "../ui.tsx";
import { AddSourceDialog } from "./AddSourceDialog.tsx";

const KIND_LABEL: Record<SourceKind, string> = {
  pdf: "PDF",
  image: "Image",
  video: "Video",
  audio: "Audio",
  transcript: "Transcript",
  youtube: "YouTube",
  web: "Web page",
  text: "Text",
  docx: "Document",
};

// Status is conveyed by text, not colour alone.
const STATUS: Record<SourceStatus, { label: string; className: string }> = {
  pending: { label: "Queued", className: "border border-rule-strong text-ink-muted" },
  processing: { label: "Reading…", className: "bg-warning-soft text-warning" },
  ready: { label: "Ready", className: "bg-success-soft text-success" },
  partial: { label: "Partly read", className: "bg-warning-soft text-warning" },
  failed: { label: "Failed", className: "bg-danger-soft text-danger" },
};

export function SourcesPane({ notebookId }: { notebookId: string }) {
  const sources = useSources(notebookId);
  const [adding, setAdding] = useState(false);
  const items = sources.data?.data ?? [];
  const selected = items.filter((s) => s.isSelected).length;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <div>
          <h2 className="text-base">Sources</h2>
          {items.length > 0 && (
            <p className="text-xs text-ink-muted" aria-live="polite">
              Answering from {selected} of {items.length}
            </p>
          )}
        </div>
        <Button size="sm" onClick={() => setAdding(true)}>
          Add
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {sources.isLoading && (
          <div className="space-y-2 px-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        )}
        {sources.error && (
          <div className="px-2">
            <ErrorState message="Couldn't load sources." onRetry={() => sources.refetch()} />
          </div>
        )}
        {sources.isSuccess && items.length === 0 && (
          <div className="px-2">
            <EmptyState
              title="Add your first source"
              body="PDFs, lecture recordings, transcripts, images, web pages or your own notes."
              action={
                <Button size="sm" onClick={() => setAdding(true)}>
                  Add a source
                </Button>
              }
            />
          </div>
        )}
        {items.length > 0 && (
          <ul className="space-y-0.5">
            {items.map((s) => (
              <SourceRow key={s.id} source={s} notebookId={notebookId} />
            ))}
          </ul>
        )}
      </div>
      <AddSourceDialog notebookId={notebookId} open={adding} onClose={() => setAdding(false)} />
    </div>
  );
}

function SourceRow({ source, notebookId }: { source: Source; notebookId: string }) {
  const update = useUpdateSource(notebookId);
  const remove = useDeleteSource(notebookId);
  const status = STATUS[source.status];
  const checkboxId = `src-${source.id}`;

  return (
    <li className="group flex items-start gap-2.5 rounded-md px-2 py-2 hover:bg-sunken">
      <input
        id={checkboxId}
        type="checkbox"
        checked={source.isSelected}
        onChange={(e) => update.mutate({ id: source.id, json: { isSelected: e.target.checked } })}
        className="mt-1 size-4 accent-[var(--color-accent)]"
        aria-describedby={`${checkboxId}-meta`}
      />
      <label htmlFor={checkboxId} className="min-w-0 flex-1 cursor-pointer">
        <span className="block truncate text-sm text-ink" title={source.title}>
          {source.title}
        </span>
        <span
          id={`${checkboxId}-meta`}
          className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-muted"
        >
          <span>{KIND_LABEL[source.kind]}</span>
          <span aria-hidden>·</span>
          <span className={cx("rounded-sm px-1.5 py-px", status.className)}>{status.label}</span>
        </span>
      </label>
      <button
        type="button"
        onClick={() => remove.mutate(source.id)}
        aria-label={`Remove ${source.title}`}
        className="rounded p-1 text-ink-faint opacity-0 hover:bg-surface hover:text-danger focus-visible:opacity-100 group-hover:opacity-100"
      >
        <svg
          viewBox="0 0 20 20"
          className="size-4"
          aria-hidden
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path d="M4 6h12M8 6V4h4v2M6 6l1 10h6l1-10" />
        </svg>
      </button>
    </li>
  );
}
