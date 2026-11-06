export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-serif text-xl tracking-tight text-ink ${className}`}>
      doubt<span className="text-accent">less</span>
    </span>
  );
}
