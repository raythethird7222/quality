import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z.string().min(1, "Employee ID is required").trim(),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const accountParamSchema = z.object({
  account: z.string().min(1, "Account is required"),
});

export const rosterParamsSchema = z.object({
  account: z.string().min(1, "Account is required"),
  slug: z.string().min(1, "Agent slug is required"),
});

export const evaluationParamsSchema = z.object({
  account: z.string().min(1, "Account is required"),
  slug: z.string().min(1, "Agent slug is required"),
  evaluationId: z.string().min(1, "Evaluation ID is required"),
});

export const createEmployeeSchema = z.object({
  employee_id: z.string().min(1, "Employee ID is required"),
  employee_name: z.string().min(1, "Employee name is required"),
  employee_email: z.string().email("Valid email is required"),
});

export const updateEmployeeSchema = z.object({
  employee_name: z.string().min(1).optional(),
  employee_email: z.string().email().optional(),
});

export const createAssignmentSchema = z.object({
  employee_id: z.number(),
  role_id: z.number(),
  account_id: z.number(),
  lob_id: z.number().nullable().optional(),
  effective_from: z.string(),
  effective_to: z.string().nullable().optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const searchSchema = z.object({
  q: z.string().default(""),
});

export const employeeQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().default(""),
  account: z.string().optional(),
  role: z.string().optional(),
});
