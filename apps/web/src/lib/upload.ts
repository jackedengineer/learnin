import { unwrap } from "@doubtless/api-client";
import type { Upload, UploadTicket } from "@doubtless/schemas";
import { UPLOAD_MIME_TYPES } from "@doubtless/schemas/constants";
import { api } from "./api.ts";

type AllowedMime = (typeof UPLOAD_MIME_TYPES)[number];

const EXTENSION_MIME: Record<string, AllowedMime> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  wav: "audio/wav",
  txt: "text/plain",
  md: "text/markdown",
  vtt: "text/vtt",
  srt: "application/x-subrip",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export const ACCEPT_ATTR = Object.keys(EXTENSION_MIME)
  .map((e) => `.${e}`)
  .join(",");

/** Browsers report odd or empty types for .srt/.md/.vtt — fall back to the extension. */
export function mimeForFile(file: File): AllowedMime | null {
  if ((UPLOAD_MIME_TYPES as readonly string[]).includes(file.type)) return file.type as AllowedMime;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_MIME[ext] ?? null;
}

/** ticket → PUT bytes (worker or presigned R2) → complete (server verifies size + magic bytes). */
export async function uploadFile(
  file: File,
  onProgress?: (fraction: number) => void,
): Promise<Upload> {
  const mime = mimeForFile(file);
  if (!mime) throw new Error(`Unsupported file type: ${file.name}`);
  const ticket = await unwrap<UploadTicket>(
    await api.v1.uploads.$post({ json: { filename: file.name, mime, size: file.size } }),
  );
  await putWithProgress(ticket, file, onProgress);
  return unwrap<Upload>(await api.v1.uploads[":id"].complete.$post({ param: { id: ticket.id } }));
}

function putWithProgress(ticket: UploadTicket, file: File, onProgress?: (f: number) => void) {
  // XHR (not fetch) because it reports upload progress.
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(ticket.method, ticket.uploadUrl);
    const sameOrigin = new URL(ticket.uploadUrl).origin === window.location.origin;
    xhr.withCredentials = sameOrigin; // presigned R2 URLs must not receive our cookies
    for (const [k, v] of Object.entries(ticket.headers)) xhr.setRequestHeader(k, v);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total);
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload failed (${xhr.status})`));
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });
}
