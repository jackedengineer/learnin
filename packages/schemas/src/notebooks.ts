import { z } from "@hono/zod-openapi";
import { Id, page, Timestamp } from "./common.ts";

export const AnswerMode = z.enum(["default", "tutor", "custom"]).openapi("AnswerMode");
export const AnswerLength = z.enum(["shorter", "default", "longer"]).openapi("AnswerLength");

const Title = z.string().trim().min(1).max(200);

export const Notebook = z
  .object({
    id: Id,
    title: z.string(),
    goals: z.string().nullable(),
    level: z.string().nullable(),
    answerMode: AnswerMode,
    answerLength: AnswerLength,
    customInstructions: z.string().nullable(),
    createdAt: Timestamp,
    updatedAt: Timestamp,
  })
  .openapi("Notebook");
export type Notebook = z.infer<typeof Notebook>;

export const NotebookPage = page(Notebook, "NotebookPage");

export const CreateNotebookInput = z
  .strictObject({
    title: Title,
    goals: z.string().trim().max(2000).nullable().optional(),
    level: z.string().trim().max(200).nullable().optional(),
  })
  .openapi("CreateNotebookInput");
export type CreateNotebookInput = z.infer<typeof CreateNotebookInput>;

export const UpdateNotebookInput = z
  .strictObject({
    title: Title.optional(),
    goals: z.string().trim().max(2000).nullable().optional(),
    level: z.string().trim().max(200).nullable().optional(),
    answerMode: AnswerMode.optional(),
    answerLength: AnswerLength.optional(),
    customInstructions: z.string().trim().max(10000).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "At least one field is required" })
  .openapi("UpdateNotebookInput");
export type UpdateNotebookInput = z.infer<typeof UpdateNotebookInput>;
