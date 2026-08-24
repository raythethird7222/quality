export const ACCOUNT_KEYS = [
  "js",
  "dft",
  "rm",
  "bf",
  "flexar",
  "spa",
  "cova",
  "fleet",
] as const;
export type AccountKey = (typeof ACCOUNT_KEYS)[number];

export const ACCOUNT_LABELS = [
  "JS",
  "DFT",
  "RM",
  "BF",
  "FLEXAR",
  "SPA",
  "COVA",
  "FLEET",
] as const;
export type AccountLabel = (typeof ACCOUNT_LABELS)[number];

export type Accent = "gold" | "indigo" | "crimson" | "charcoal";

export const USER_ROLES = [
  "admin",
  "quality_coordinator",
  "account_manager",
  "qa",
  "qa_supervisor",
  "team_lead",
  "agent",
] as const;
export type UserRole = (typeof USER_ROLES)[number];

export type AccountAssignment = {
  account: AccountLabel;
  account_name: string;
  role: UserRole;
  role_name: string;
};

export type AuthUser = {
  employee_name: string;
  employee_email: string;
  employee_id: string;
  account: AccountLabel;
  account_name: string;
  role: UserRole;
  role_name: string;
  avatar_url?: string;
  accounts: AccountAssignment[];
};

export type AccentColors = {
  text: string;
  bg: string;
  border: string;
  hoverBg: string;
  bgLight: string;
  hex: string;
};

export type TeamMember = {
  name: string;
  initial: string;
  agents: number;
};

export type AgentPerformance = {
  name: string;
  score: string;
  opportunities: number;
};

export type EvaluationDay = {
  time: string;
  type: string;
  score: string;
};

export type Clause = {
  code: string;
  description: string;
  checked: boolean;
};

export type AttributeGroup = {
  code: string;
  bracket: string;
  clauses: Clause[];
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
