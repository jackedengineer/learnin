import { Link } from "@tanstack/react-router";

export function NotFound() {
  return (
    <main className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-3xl">Page not found</h1>
      <p className="mt-2 text-ink-muted">That page doesn't exist, or it belongs to someone else.</p>
      <Link to="/" className="mt-6 inline-block text-accent underline underline-offset-4">
        Back to your notebooks
      </Link>
    </main>
  );
}
