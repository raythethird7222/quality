export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      employees: {
        Row: {
          id: number;
          employee_id: string | null;
          employee_name: string | null;
          employee_email: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          employee_id?: string | null;
          employee_name?: string | null;
          employee_email?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          employee_id?: string | null;
          employee_name?: string | null;
          employee_email?: string | null;
          created_at?: string;
        };
      };
      accounts: {
        Row: {
          account_id: number;
          account_code: string;
          account_name: string;
          created_at: string;
        };
        Insert: {
          account_id?: number;
          account_code: string;
          account_name: string;
          created_at?: string;
        };
        Update: {
          account_id?: number;
          account_code?: string;
          account_name?: string;
          created_at?: string;
        };
      };
      roles: {
        Row: {
          role_id: number;
          role_name: string;
          created_at: string;
        };
        Insert: {
          role_id?: number;
          role_name: string;
          created_at?: string;
        };
        Update: {
          role_id?: number;
          role_name?: string;
          created_at?: string;
        };
      };
      lobs: {
        Row: {
          lob_id: number;
          lob_name: string;
          account_id: number;
          created_at: string;
        };
        Insert: {
          lob_id?: number;
          lob_name: string;
          account_id: number;
          created_at?: string;
        };
        Update: {
          lob_id?: number;
          lob_name?: string;
          account_id?: number;
          created_at?: string;
        };
      };
      employee_assignments: {
        Row: {
          assignment_id: number;
          employee_id: number;
          role_id: number;
          account_id: number;
          lob_id: number | null;
          team_lead_id: number | null;
          qa_coach_id: number | null;
          qa_evaluator_id: number | null;
          effective_from: string | null;
          effective_to: string | null;
          created_at: string;
        };
        Insert: {
          assignment_id?: number;
          employee_id: number;
          role_id: number;
          account_id: number;
          lob_id?: number | null;
          team_lead_id?: number | null;
          qa_coach_id?: number | null;
          qa_evaluator_id?: number | null;
          effective_from?: string | null;
          effective_to?: string | null;
          created_at?: string;
        };
        Update: {
          assignment_id?: number;
          employee_id?: number;
          role_id?: number;
          account_id?: number;
          lob_id?: number | null;
          team_lead_id?: number | null;
          qa_coach_id?: number | null;
          qa_evaluator_id?: number | null;
          effective_from?: string | null;
          effective_to?: string | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];