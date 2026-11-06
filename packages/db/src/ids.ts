import { uuidv7 } from "uuidv7";

/** UUIDv7: time-ordered, opaque, generated in the app (ADR-0002). */
export const newId = (): string => uuidv7();
