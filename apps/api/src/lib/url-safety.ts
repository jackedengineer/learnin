import { ApiError } from "./problem.ts";

const BLOCKED_HOST_SUFFIXES = [".local", ".internal", ".localhost", ".home.arpa", ".lan"];

/**
 * Cheap, synchronous URL vetting at the API boundary. The ingestion fetcher (Phase 1)
 * re-validates after DNS resolution and on every redirect (ARCHITECTURE §9).
 */
export function assertPublicHttpUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw invalid("Not a valid URL");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:")
    throw invalid("Only http(s) URLs are supported");
  if (url.username || url.password) throw invalid("URLs with credentials are not allowed");
  if (url.port && url.port !== "80" && url.port !== "443")
    throw invalid("Non-standard ports are not allowed");
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || BLOCKED_HOST_SUFFIXES.some((s) => host.endsWith(s))) {
    throw invalid("Private hostnames are not allowed");
  }
  if (!host.includes(".")) throw invalid("Hostname must be fully qualified");
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.startsWith("[")) {
    throw invalid("IP-address URLs are not allowed");
  }
  url.hash = "";
  return url;
}

export function isYouTubeUrl(url: URL): boolean {
  const h = url.hostname.replace(/^www\.|^m\./, "");
  if (h === "youtu.be") return url.pathname.length > 1;
  if (h === "youtube.com") {
    return (
      (url.pathname === "/watch" && url.searchParams.has("v")) ||
      url.pathname.startsWith("/shorts/") ||
      url.pathname.startsWith("/live/")
    );
  }
  return false;
}

const invalid = (detail: string) =>
  new ApiError(422, "source.invalid_url", "Invalid source URL", detail);
