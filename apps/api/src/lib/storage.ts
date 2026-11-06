import type { SourceKind } from "@doubtless/schemas";
import { AwsClient } from "aws4fetch";
import type { Config } from "./config.ts";

/** Where the client should PUT the bytes for an upload. */
export async function uploadTarget(
  config: Config,
  upload: { id: string; storageKey: string; declaredMime: string; declaredSize: number },
  expiresInSeconds: number,
): Promise<{ url: string; headers: Record<string, string> }> {
  const headers = { "content-type": upload.declaredMime };
  if (config.uploadMode === "worker" || !config.r2) {
    // Bytes stream through the Worker into the R2 binding (local dev, small deployments).
    return { url: `${config.baseUrl}/v1/uploads/${upload.id}/content`, headers };
  }
  // Direct-to-R2 presigned PUT (production): bytes never touch the Worker.
  const client = new AwsClient({
    accessKeyId: config.r2.accessKeyId,
    secretAccessKey: config.r2.secretAccessKey,
    service: "s3",
    region: "auto",
  });
  const url = new URL(
    `https://${config.r2.accountId}.r2.cloudflarestorage.com/${config.r2.bucket}/${upload.storageKey}`,
  );
  url.searchParams.set("X-Amz-Expires", String(expiresInSeconds));
  const signed = await client.sign(new Request(url, { method: "PUT", headers }), {
    aws: { signQuery: true },
  });
  return { url: signed.url, headers };
}

/** Detect the real type from magic bytes. Returns null when unrecognised. */
export function sniffMime(bytes: Uint8Array, declared: string): string | null {
  const at = (offset: number, sig: number[]) => sig.every((b, i) => bytes[offset + i] === b);
  const ascii = (offset: number, s: string) =>
    at(
      offset,
      [...s].map((ch) => ch.charCodeAt(0)),
    );

  if (ascii(0, "%PDF-")) return "application/pdf";
  if (at(0, [0x89, 0x50, 0x4e, 0x47])) return "image/png";
  if (at(0, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (ascii(0, "GIF8")) return "image/gif";
  if (ascii(0, "RIFF") && ascii(8, "WEBP")) return "image/webp";
  if (ascii(0, "RIFF") && ascii(8, "WAVE")) return "audio/wav";
  if (at(0, [0x1a, 0x45, 0xdf, 0xa3]))
    return declared.startsWith("audio/") ? "audio/webm" : "video/webm";
  if (ascii(4, "ftyp")) {
    const brand = String.fromCharCode(...bytes.slice(8, 12));
    if (brand.startsWith("M4A")) return "audio/mp4";
    if (brand === "qt  ") return "video/quicktime";
    return declared.startsWith("audio/") ? "audio/mp4" : "video/mp4";
  }
  if (ascii(0, "ID3") || at(0, [0xff, 0xfb]) || at(0, [0xff, 0xf3]) || at(0, [0xff, 0xf2]))
    return "audio/mpeg";
  if (at(0, [0x50, 0x4b, 0x03, 0x04])) {
    return declared === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ? declared
      : null;
  }
  if (isProbablyText(bytes)) {
    const head = new TextDecoder().decode(bytes.slice(0, 16)).replace(/^﻿/, "");
    if (head.startsWith("WEBVTT")) return "text/vtt";
    if (declared === "application/x-subrip" || declared === "text/markdown") return declared;
    return "text/plain";
  }
  return null;
}

function isProbablyText(bytes: Uint8Array): boolean {
  if (bytes.length === 0) return false;
  try {
    new TextDecoder("utf-8", { fatal: true, ignoreBOM: false }).decode(
      bytes.slice(0, Math.min(bytes.length, 4000)),
    );
  } catch {
    // A multi-byte char cut at the sample boundary is fine; anything else is binary.
    if (bytes.length < 4000) return false;
  }
  return !bytes.slice(0, 4000).includes(0);
}

export function kindForMime(mime: string): SourceKind | null {
  if (mime === "application/pdf") return "pdf";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime === "text/vtt" || mime === "application/x-subrip") return "transcript";
  if (mime === "text/plain" || mime === "text/markdown") return "text";
  if (mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    return "docx";
  return null;
}

/** The detected type must be compatible with what the client declared. */
export function isCompatible(declared: string, detected: string): boolean {
  if (declared === detected) return true;
  const family = (m: string) => kindForMime(m);
  if (family(declared) === family(detected)) return true;
  // Text-ish declarations (srt/md/txt) may legitimately sniff as plain text.
  return (
    ["text/plain", "text/markdown", "application/x-subrip"].includes(declared) &&
    detected === "text/plain"
  );
}
