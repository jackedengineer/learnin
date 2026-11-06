import { ApiProblemError } from "@doubtless/api-client";
import { type FormEvent, useRef, useState } from "react";
import { newIdempotencyKey, useCreateSource } from "../../lib/queries.ts";
import { ACCEPT_ATTR, mimeForFile, uploadFile } from "../../lib/upload.ts";
import { Dialog } from "../Dialog.tsx";
import { Button, cx, ErrorState, Field, Input, Textarea } from "../ui.tsx";

type Mode = "file" | "url" | "text";

const describe = (e: unknown) =>
  e instanceof ApiProblemError
    ? (e.problem.detail ?? e.problem.title)
    : e instanceof Error
      ? e.message
      : "Something went wrong";

export function AddSourceDialog({
  notebookId,
  open,
  onClose,
}: {
  notebookId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<Mode>("file");
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add a source"
      description="Answers will cite it down to the page or timestamp."
    >
      <div
        role="tablist"
        aria-label="Source type"
        className="mb-4 inline-flex rounded-md border border-rule-strong p-0.5"
      >
        {(
          [
            ["file", "Upload file"],
            ["url", "Link"],
            ["text", "Paste text"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mode === id}
            onClick={() => setMode(id)}
            className={cx(
              "rounded px-3 py-1.5 text-sm",
              mode === id ? "bg-accent text-on-accent" : "text-ink-muted hover:text-ink",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {mode === "file" && <FileForm notebookId={notebookId} onDone={onClose} />}
      {mode === "url" && <UrlForm notebookId={notebookId} onDone={onClose} />}
      {mode === "text" && <TextForm notebookId={notebookId} onDone={onClose} />}
    </Dialog>
  );
}

function FileForm({ notebookId, onDone }: { notebookId: string; onDone: () => void }) {
  const create = useCreateSource(notebookId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setError(null);
    try {
      setProgress(0);
      const upload = await uploadFile(file, setProgress);
      // The intent is "make a source from THIS upload": derive the key from the upload id so a
      // retried create replays, while a re-upload (new id) is a new intent.
      await create.mutateAsync({
        json: { type: "upload", uploadId: upload.id },
        key: `source-from-upload:${upload.id}`,
      });
      onDone();
    } catch (err) {
      setError(describe(err));
    } finally {
      setProgress(null);
    }
  }

  const unsupported = file && !mimeForFile(file);
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field
        id="src-file"
        label="File"
        hint="PDF, image, video, audio, .vtt/.srt transcript, .txt/.md, .docx — up to 200 MB"
        error={unsupported ? "This file type isn't supported yet." : undefined}
      >
        <input
          ref={inputRef}
          id="src-file"
          type="file"
          accept={ACCEPT_ATTR}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          aria-describedby="src-file-hint"
          className="block w-full text-sm text-ink-muted file:mr-3 file:rounded-md file:border file:border-rule-strong file:bg-surface file:px-3 file:py-1.5 file:text-sm file:text-ink hover:file:bg-sunken"
        />
      </Field>
      {progress !== null && (
        <div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-sunken"
            role="progressbar"
            aria-label="Upload progress"
            aria-valuenow={Math.round(progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-accent transition-[width]"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-ink-muted">Uploading… {Math.round(progress * 100)}%</p>
        </div>
      )}
      {error && <ErrorState message={error} />}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={!file || !!unsupported}
          busy={progress !== null || create.isPending}
        >
          Add file
        </Button>
      </div>
    </form>
  );
}

function UrlForm({ notebookId, onDone }: { notebookId: string; onDone: () => void }) {
  const create = useCreateSource(notebookId);
  const [url, setUrl] = useState("");
  const [key] = useState(newIdempotencyKey);
  function submit(e: FormEvent) {
    e.preventDefault();
    create.mutate({ json: { type: "url", url: url.trim() }, key }, { onSuccess: onDone });
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field id="src-url" label="Web page or YouTube link">
        <Input
          id="src-url"
          type="url"
          required
          autoFocus
          inputMode="url"
          placeholder="https://"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </Field>
      {create.error && <ErrorState message={describe(create.error)} />}
      <div className="flex justify-end">
        <Button type="submit" busy={create.isPending} disabled={!url.trim()}>
          Add link
        </Button>
      </div>
    </form>
  );
}

function TextForm({ notebookId, onDone }: { notebookId: string; onDone: () => void }) {
  const create = useCreateSource(notebookId);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [key] = useState(newIdempotencyKey);
  function submit(e: FormEvent) {
    e.preventDefault();
    create.mutate(
      { json: { type: "text", title: title.trim(), text }, key },
      { onSuccess: onDone },
    );
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field id="src-title" label="Title">
        <Input
          id="src-title"
          required
          maxLength={300}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Lecture 3 notes"
        />
      </Field>
      <Field id="src-text" label="Text">
        <Textarea
          id="src-text"
          required
          rows={8}
          maxLength={500000}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </Field>
      {create.error && <ErrorState message={describe(create.error)} />}
      <div className="flex justify-end">
        <Button type="submit" busy={create.isPending} disabled={!title.trim() || !text.trim()}>
          Add text
        </Button>
      </div>
    </form>
  );
}
