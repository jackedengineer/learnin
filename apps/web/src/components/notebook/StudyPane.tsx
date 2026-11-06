import { useState } from "react";
import { cx } from "../ui.tsx";

const TABS = ["Viewer", "Study", "Notes"] as const;
const COPY: Record<(typeof TABS)[number], string> = {
  Viewer: "Click a citation in an answer to open the exact page or video moment here.",
  Study: "Flashcards and quizzes built from your sources, each linked back to where it came from.",
  Notes: "Save answers here with their citations intact.",
};

export function StudyPane() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Viewer");
  return (
    <div className="flex h-full flex-col">
      <div role="tablist" aria-label="Study tools" className="flex gap-1 px-3 pt-3">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cx(
              "rounded-md px-3 py-1.5 text-sm",
              tab === t ? "bg-sunken font-medium text-ink" : "text-ink-muted hover:text-ink",
            )}
          >
            {t}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="px-4 py-6 text-sm text-ink-muted">
        {COPY[tab]}
      </div>
    </div>
  );
}
