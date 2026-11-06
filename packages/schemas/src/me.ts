import { z } from "@hono/zod-openapi";
import { Id, Timestamp } from "./common.ts";

export const Profile = z
  .object({
    goals: z.string().nullable(),
    level: z.string().nullable(),
    style: z.string().nullable(),
    isOnboarded: z.boolean(),
    updatedAt: Timestamp.nullable(),
  })
  .openapi("Profile");

export const Me = z
  .object({
    user: z.object({ id: Id, name: z.string(), email: z.email(), image: z.string().nullable() }),
    profile: Profile,
  })
  .openapi("Me");
export type Me = z.infer<typeof Me>;

export const UpdateProfileInput = z
  .strictObject({
    goals: z.string().trim().max(2000).nullable().optional(),
    level: z.string().trim().max(200).nullable().optional(),
    style: z.string().trim().max(2000).nullable().optional(),
    isOnboarded: z.boolean().optional(),
  })
  .openapi("UpdateProfileInput");
export type UpdateProfileInput = z.infer<typeof UpdateProfileInput>;
