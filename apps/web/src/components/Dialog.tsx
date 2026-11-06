import { type ReactNode, useEffect, useRef } from "react";

/** Native <dialog>: built-in focus trap, Esc to close, inert background, top-layer rendering. */
export function Dialog({
  open,
  onClose,
  title,
  children,
  description,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="dialog-title"
      aria-describedby={description ? "dialog-desc" : undefined}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-lg border border-rule bg-surface p-0 text-ink backdrop:bg-ink/40"
    >
      <div className="flex items-start justify-between gap-4 border-b border-rule px-5 py-4">
        <div>
          <h2 id="dialog-title" className="text-lg">
            {title}
          </h2>
          {description && (
            <p id="dialog-desc" className="mt-0.5 text-sm text-ink-muted">
              {description}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="rounded-md p-1 text-ink-muted hover:bg-sunken hover:text-ink"
        >
          <svg
            viewBox="0 0 20 20"
            className="size-5"
            aria-hidden
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <path d="M5 5l10 10M15 5L5 15" />
          </svg>
        </button>
      </div>
      <div className="px-5 py-4">{open && children}</div>
    </dialog>
  );
}
