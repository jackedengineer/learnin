import {
  type ButtonHTMLAttributes,
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
const buttonStyles: Record<ButtonVariant, string> = {
  primary: "bg-accent text-on-accent hover:bg-accent-hover",
  secondary: "bg-surface text-ink border border-rule-strong hover:bg-sunken",
  ghost: "text-ink-muted hover:text-ink hover:bg-sunken",
  danger: "bg-surface text-danger border border-rule-strong hover:bg-danger-soft",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: "sm" | "md";
    busy?: boolean;
  }
>(function Button(
  { variant = "primary", size = "md", busy, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      {...rest}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        size === "sm" ? "h-8 px-3 text-sm" : "h-10 px-4 text-sm",
        buttonStyles[variant],
        className,
      )}
    >
      {busy && <Spinner />}
      {children}
    </button>
  );
});

export function Spinner() {
  return (
    <span
      aria-hidden
      className="size-3.5 rounded-full border-2 border-current border-r-transparent animate-spin"
    />
  );
}

export function Field({
  label,
  hint,
  error,
  children,
  id,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  id: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

const fieldBase =
  "w-full rounded-md border border-rule-strong bg-surface px-3 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return <input ref={ref} {...rest} className={cx(fieldBase, "h-10", className)} />;
  },
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...rest }, ref) {
  return (
    <textarea ref={ref} {...rest} className={cx(fieldBase, "py-2 leading-relaxed", className)} />
  );
});

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cx("animate-pulse rounded-md bg-sunken", className)} />;
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div
      role="status"
      className="rounded-lg border border-dashed border-rule-strong px-6 py-10 text-center"
    >
      <h3 className="text-lg text-ink">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">{body}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
    >
      <p>{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 font-medium underline underline-offset-2"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export { cx };
