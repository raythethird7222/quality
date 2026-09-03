// Input validation schemas (zod) for forms and API request bodies.

import { z } from "zod";

// Validates the login form: employee email plus the employee's actual password.
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(254, "Email is invalid"),
  // The password is validated and compared against the stored bcrypt hash.
  password: z
    .string()
    .trim()
    .min(1, "Email and Password are required")
    .max(120, "Password is invalid")
    .regex(/^[A-Za-z0-9._-]+$/, "Password is invalid"),
  rememberMe: z.boolean().optional().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Validates a route param that carries a single account code.
export const accountParamSchema = z.object({
  account: z
    .string()
    .trim()
    .min(1, "Account is required")
    .max(32, "Account is invalid")
    .regex(/^[A-Za-z0-9_-]+$/, "Account is invalid"),
});

// Validates route params for a single agent's roster page.
export const rosterParamsSchema = z.object({
  account: accountParamSchema.shape.account,
  slug: z.string().min(1, "Agent slug is required"),
});

// Validates route params for a single evaluation detail page.
export const evaluationParamsSchema = z.object({
  account: accountParamSchema.shape.account,
  slug: z.string().min(1, "Agent slug is required"),
  evaluationId: z.string().min(1, "Evaluation ID is required"),
});

// Validates the body for creating a new employee.
export const createEmployeeSchema = z.object({
  employee_code: z.string().trim().min(1, "Employee code is required").max(50),
  employee_name: z.string().trim().min(1, "Employee name is required").max(200),
  employee_email: z.string().trim().email("Valid email is required").max(254),
  status_id: z.number().int().positive().optional(),
  hire_date: z.string().date().nullable().optional(),
  vici_link: z.string().trim().url("Valid VICI link is required").max(500).nullable().optional(),
});

// Validates the (partial) body for updating an employee's profile fields.
export const updateEmployeeSchema = z.object({
  employee_code: z.string().trim().min(1).max(50).optional(),
  employee_name: z.string().trim().min(1).max(200).optional(),
  employee_email: z.string().trim().email().max(254).optional(),
  status_id: z.number().int().positive().optional(),
  hire_date: z.string().date().nullable().optional(),
  vici_link: z.string().trim().url("Valid VICI link is required").max(500).nullable().optional(),
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
  account: accountParamSchema.shape.account.optional(),
  role: z.string().optional(),
});

export const evaluationsQuerySchema = z.object({
  account: accountParamSchema.shape.account,
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  agent: z.string().trim().min(1).optional(),
});

export const analyticsQuerySchema = z.object({
  account: accountParamSchema.shape.account,
  lob: z.string().trim().min(1).optional(),
  guideline: z.string().trim().min(1).optional(),
  timeframe: z.enum(["Daily", "Weekly", "Monthly"]).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const dashboardQuerySchema = z.object({
  timeframe: z.enum(["Daily", "Weekly", "Monthly"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date").optional(),
});

export const createEvaluationSchema = z.object({
  agentName: z.string().trim().min(1, "Agent is required"),
  guideline: z.string().trim().min(1, "Guideline is required"),
  evaluationDate: z.string().trim().min(1, "Evaluation date is required"),
  qaScore: z.number().min(0).max(100),
  ticketBill: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(5000).optional(),
  checked: z
    .array(
      z.object({
        parameterId: z.number().int().positive(),
        checked: z.boolean(),
      })
    )
    .min(1, "Checklist is required"),
});
