// Zod validation schemas for the agent assignment write path. Shared by the
// client (basic guards) and the server API route (authoritative validation).

import { z } from "zod";

// Shape of a brand-new employee created through the Add Agent flow.
export const newEmployeeSchema = z.object({
  employeeCode: z
    .string()
    .trim()
    .min(1, "Employee code is required")
    .max(50, "Employee code is too long"),
  employeeName: z
    .string()
    .trim()
    .min(1, "Employee name is required")
    .max(200, "Employee name is too long"),
  employeeEmail: z
    .string()
    .trim()
    .max(255, "Email is too long")
    .email("Enter a valid email address")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  hireDate: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

// A single agent assignment row: references an existing agent by id, or a new
// employee by `agent`, plus the LOB and optional QA/team-lead relationships.
export const assignmentRowSchema = z
  .object({
    assignmentId: z.number().int().positive().optional(),
    agentId: z.number().int().positive().optional(),
    agent: newEmployeeSchema.optional(),
    lobId: z.number().int().positive("Select a LOB"),
    coachId: z.number().int().positive().nullable().optional(),
    evaluatorId: z.number().int().positive().nullable().optional(),
    teamLeadId: z.number().int().positive().nullable().optional(),
  })
  .refine(
    (r) =>
      r.assignmentId != null || r.agentId != null || r.agent != null,
    {
      message:
        "Each assignment must reference an existing agent or a new employee",
    }
  );

// The full request payload: a non-empty list of assignment rows.
export const assignmentPayloadSchema = z.object({
  rows: z
    .array(assignmentRowSchema)
    .min(1, "At least one assignment is required"),
});

export type NewEmployeeInput = z.infer<typeof newEmployeeSchema>;
export type AssignmentRowInput = z.infer<typeof assignmentRowSchema>;
