// Input validation schemas (zod) for forms and API request bodies.

import { z } from "zod";

// Validates the login form: employee email plus an employee code as password.
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z.string().min(1, "Employee code is required").trim(),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Validates a route param that carries a single account code.
export const accountParamSchema = z.object({
  account: z.string().min(1, "Account is required"),
});

// Validates route params for a single agent's roster page.
export const rosterParamsSchema = z.object({
  account: z.string().min(1, "Account is required"),
  slug: z.string().min(1, "Agent slug is required"),
});

// Validates route params for a single evaluation detail page.
export const evaluationParamsSchema = z.object({
  account: z.string().min(1, "Account is required"),
  slug: z.string().min(1, "Agent slug is required"),
  evaluationId: z.string().min(1, "Evaluation ID is required"),
});

// Validates the body for creating a new employee.
export const createEmployeeSchema = z.object({
  employee_code: z.string().min(1, "Employee code is required"),
  employee_name: z.string().min(1, "Employee name is required"),
  employee_email: z.string().email("Valid email is required"),
});

// Validates the (partial) body for updating an employee's profile fields.
export const updateEmployeeSchema = z.object({
  employee_name: z.string().min(1).optional(),
  employee_email: z.string().email().optional(),
});

// Validates the body for creating an employee account assignment.
export const createAssignmentSchema = z.object({
  employee_id: z.number(),
  role_id: z.number(),
  account_id: z.number(),
  lob_id: z.number().nullable().optional(),
  effective_from: z.string(),
  effective_to: z.string().nullable().optional(),
});

// Validates and coerces pagination query params (1-based page, capped size).
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

// Validates a free-text search query param.
export const searchSchema = z.object({
  q: z.string().default(""),
});

// Validates employee list query params: pagination, search, and filters.
export const employeeQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().default(""),
  account: z.string().optional(),
  role: z.string().optional(),
});
