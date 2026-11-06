export function ChatPane() {
  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="max-w-sm text-center">
          <h2 className="text-xl">Ask a doubt</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Grounded answers with page- and timestamp-level citations arrive in the next release.
            Add your sources now so they're ready.
          </p>
        </div>
      </div>
      <form
        className="border-t border-rule p-3"
        onSubmit={(e) => e.preventDefault()}
        aria-label="Ask a question"
      >
        <label htmlFor="composer" className="sr-only">
          Your question
        </label>
        <textarea
          id="composer"
          disabled
          rows={2}
          placeholder="Chat is coming in Phase 1…"
          className="w-full resize-none rounded-md border border-rule-strong bg-surface px-3 py-2 text-sm placeholder:text-ink-faint disabled:opacity-60"
        />
      </form>
    </div>
  );
}
