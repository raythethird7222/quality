// Zod validation schema for the create-account write path. Shared by the
// client (basic guards) and the server API route (authoritative validation).

import { z } from "zod";

// Shape of a new account created by a QA supervisor / manager.
export const createAccountSchema = z.object({
  code: z
    .string()
    .trim()
    .transform((v) => v.toUpperCase())
    .pipe(
      z
        .string()
        .min(2, "Account code must be at least 2 characters")
        .max(10, "Account code must be 10 characters or fewer")
        .regex(/^[A-Z0-9]+$/, "Account code may only contain letters and numbers")
    ),
  name: z
    .string()
    .trim()
    .min(1, "Account name is required")
    .max(120, "Account name is too long"),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
