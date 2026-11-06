import { useParams } from "@tanstack/react-router";
import { useState } from "react";
import { ChatPane } from "../components/notebook/ChatPane.tsx";
import { SourcesPane } from "../components/notebook/SourcesPane.tsx";
import { StudyPane } from "../components/notebook/StudyPane.tsx";
import { cx, ErrorState, Skeleton } from "../components/ui.tsx";
import { useNotebook } from "../lib/queries.ts";
import { NotFound } from "./NotFound.tsx";

type Pane = "sources" | "chat" | "study";
const PANES: { id: Pane; label: string }[] = [
  { id: "sources", label: "Sources" },
  { id: "chat", label: "Chat" },
  { id: "study", label: "Study" },
];

export function NotebookPage() {
  const { notebookId } = useParams({ from: "/authed/notebooks/$notebookId" });
  const notebook = useNotebook(notebookId);
  const [pane, setPane] = useState<Pane>("chat");

  if (notebook.error) {
    const status = (notebook.error as { status?: number }).status;
    return status === 404 ? (
      <NotFound />
    ) : (
      <ErrorState message="Couldn't load this notebook." onRetry={() => notebook.refetch()} />
    );
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-rule px-4 py-3 sm:px-6">
        {notebook.data ? (
          <h1 className="truncate text-xl">{notebook.data.title}</h1>
        ) : (
          <Skeleton className="h-7 w-64" />
        )}
      </div>

      {/* Mobile: one pane at a time. Desktop (lg+): all three side by side. */}
      <div
        role="tablist"
        aria-label="Notebook panes"
        className="flex border-b border-rule lg:hidden"
      >
        {PANES.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            id={`tab-${p.id}`}
            aria-selected={pane === p.id}
            aria-controls={`pane-${p.id}`}
            onClick={() => setPane(p.id)}
            className={cx(
              "flex-1 border-b-2 py-2.5 text-sm",
              pane === p.id
                ? "border-accent font-medium text-ink"
                : "border-transparent text-ink-muted",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(16rem,20rem)_1fr_minmax(16rem,22rem)]">
        <section
          id="pane-sources"
          aria-label="Sources"
          className={cx("min-h-0 border-rule lg:block lg:border-r", pane !== "sources" && "hidden")}
        >
          <SourcesPane notebookId={notebookId} />
        </section>
        <section
          id="pane-chat"
          aria-label="Chat"
          className={cx("min-h-0 lg:flex", pane === "chat" ? "flex" : "hidden")}
        >
          <ChatPane />
        </section>
        <section
          id="pane-study"
          aria-label="Study"
          className={cx("min-h-0 border-rule lg:block lg:border-l", pane !== "study" && "hidden")}
        >
          <StudyPane />
        </section>
      </div>
    </main>
  );
}
