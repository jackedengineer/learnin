import type {
  Notebook as NotebookRow,
  Source as SourceRow,
  Upload as UploadRow,
} from "@doubtless/db";
import type { Notebook, Source, Upload } from "@doubtless/schemas";

export const toNotebook = (n: NotebookRow): Notebook => ({
  id: n.id,
  title: n.title,
  goals: n.goals,
  level: n.level,
  answerMode: n.answerMode,
  answerLength: n.answerLength,
  customInstructions: n.customInstructions,
  createdAt: n.createdAt.toISOString(),
  updatedAt: n.updatedAt.toISOString(),
});

export const toSource = (s: SourceRow): Source => ({
  id: s.id,
  notebookId: s.notebookId,
  kind: s.kind,
  title: s.title,
  originUrl: s.originUrl,
  mime: s.mime,
  byteSize: s.byteSize,
  status: s.status,
  error: s.error ?? null,
  isSelected: s.isSelected,
  priority: s.priority,
  addedVia: s.addedVia,
  createdAt: s.createdAt.toISOString(),
  updatedAt: s.updatedAt.toISOString(),
});

export const toUpload = (u: UploadRow): Upload => ({
  id: u.id,
  filename: u.filename,
  status: u.status,
  detectedMime: u.detectedMime,
  byteSize: u.byteSize,
});
