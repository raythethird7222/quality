// Database type definitions derived from the Supabase schema, describing
// tables, row shapes, and the Json helper type used across the data layer.

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
          employee_code: string | null;
          employee_name: string | null;
          employee_email: string | null;
          status_id: number | null;
          hire_date: string | null;
          vici_link: string | null;
          avatar_url: string | null;
        };
        Insert: {
          id?: number;
          employee_code?: string | null;
          employee_name?: string | null;
          employee_email?: string | null;
          status_id?: number | null;
          hire_date?: string | null;
          vici_link?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          id?: number;
          employee_code?: string | null;
          employee_name?: string | null;
          employee_email?: string | null;
          status_id?: number | null;
          hire_date?: string | null;
          vici_link?: string | null;
          avatar_url?: string | null;
        };
        Relationships: [];
      };
      accounts: {
        Row: {
          account_id: number;
          account_code: string;
          account_name: string;
        };
        Insert: {
          account_id?: number;
          account_code: string;
          account_name: string;
        };
        Update: {
          account_id?: number;
          account_code?: string;
          account_name?: string;
        };
        Relationships: [];
      };
      roles: {
        Row: {
          role_id: number;
          role_name: string;
        };
        Insert: {
          role_id?: number;
          role_name: string;
        };
        Update: {
          role_id?: number;
          role_name?: string;
        };
        Relationships: [];
      };
      lobs: {
        Row: {
          lob_id: number;
          lob_name: string;
          account_id: number;
        };
        Insert: {
          lob_id?: number;
          lob_name: string;
          account_id: number;
        };
        Update: {
          lob_id?: number;
          lob_name?: string;
          account_id?: number;
        };
        Relationships: [];
      };
      statuses: {
        Row: {
          status_id: number;
          status_name: string;
        };
        Insert: {
          status_id?: number;
          status_name: string;
        };
        Update: {
          status_id?: number;
          status_name?: string;
        };
        Relationships: [];
      };
      employee_assignments: {
        Row: {
          assignment_id: number;
          employee_id: number;
          role_id: number | null;
          account_id: number | null;
          lob_id: number | null;
          effective_from: string | null;
          effective_to: string | null;
        };
        Insert: {
          assignment_id?: number;
          employee_id: number;
          role_id?: number | null;
          account_id?: number | null;
          lob_id?: number | null;
          effective_from?: string | null;
          effective_to?: string | null;
        };
        Update: {
          assignment_id?: number;
          employee_id?: number;
          role_id?: number | null;
          account_id?: number | null;
          lob_id?: number | null;
          effective_from?: string | null;
          effective_to?: string | null;
        };
        Relationships: [];
      };
      rm_covers: {
        Row: {
          cover_id: number;
          employee_id: number;
          cover_name: string;
          lob_id: number | null;
        };
        Insert: {
          cover_id?: number;
          employee_id: number;
          cover_name: string;
          lob_id?: number | null;
        };
        Update: {
          cover_id?: number;
          employee_id?: number;
          cover_name?: string;
          lob_id?: number | null;
        };
        Relationships: [];
      };
      evaluations: {
        Row: {
          evaluation_id: number;
          source_evaluation_id: string;
          evaluation_type: string;
          account_id: number;
          lob_id: number | null;
          agent_employee_id: number;
          qa_coach_employee_id: number | null;
          qa_evaluator_employee_id: number | null;
          team_lead_employee_id: number | null;
          source_team_lead_name: string | null;
          guideline: string | null;
          evaluation_date: string | null;
          ticket_bill: string | null;
          qa_score: number | null;
          opportunities: string | null;
          notes: string | null;
          submission_datetime: string | null;
          edited_datetime: string | null;
          source_table: string;
          checkbox_results: Json | null;
          created_at: string;
        };
        Insert: {
          evaluation_id?: number;
          source_evaluation_id: string;
          evaluation_type: string;
          account_id: number;
          lob_id?: number | null;
          agent_employee_id: number;
          qa_coach_employee_id?: number | null;
          qa_evaluator_employee_id?: number | null;
          team_lead_employee_id?: number | null;
          source_team_lead_name?: string | null;
          guideline?: string | null;
          evaluation_date?: string | null;
          ticket_bill?: string | null;
          qa_score?: number | null;
          opportunities?: string | null;
          notes?: string | null;
          submission_datetime?: string | null;
          edited_datetime?: string | null;
          source_table: string;
          checkbox_results?: Json | null;
          created_at?: string;
        };
        Update: {
          evaluation_id?: number;
          source_evaluation_id?: string;
          evaluation_type?: string;
          account_id?: number;
          lob_id?: number | null;
          agent_employee_id?: number;
          qa_coach_employee_id?: number | null;
          qa_evaluator_employee_id?: number | null;
          team_lead_employee_id?: number | null;
          source_team_lead_name?: string | null;
          guideline?: string | null;
          evaluation_date?: string | null;
          ticket_bill?: string | null;
          qa_score?: number | null;
          opportunities?: string | null;
          notes?: string | null;
          submission_datetime?: string | null;
          edited_datetime?: string | null;
          source_table?: string;
          checkbox_results?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      evaluation_parameters: {
        Row: {
          id: number;
          lob_name: string | null;
          guideline: string;
          attributes: string | null;
          clauses: string | null;
          score: string | null;
          compound: string | null;
          description: string | null;
          account_id: number;
          lob_id: number | null;
          display_order: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          lob_name?: string | null;
          guideline: string;
          attributes?: string | null;
          clauses?: string | null;
          score?: string | null;
          compound?: string | null;
          description?: string | null;
          account_id: number;
          lob_id?: number | null;
          display_order?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          lob_name?: string | null;
          guideline?: string;
          attributes?: string | null;
          clauses?: string | null;
          score?: string | null;
          compound?: string | null;
          description?: string | null;
          account_id?: number;
          lob_id?: number | null;
          display_order?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      rm_mqpm_performance: {
        Row: {
          mqpm_id: number;
          employee_id: number;
          account_id: number;
          qa_coach_employee_id: number | null;
          performance_month: string;
          mtd_qa_average: number | null;
          product_score: number | null;
          penalty: number | null;
          score_difference: number | null;
          mqpm_score: number | null;
          rating: string | null;
          process_compliance: number | null;
          failed_evaluations: number | null;
          previous_mqpm_score: number | null;
          previous_score_difference: number | null;
          opportunities: string | null;
        };
        Insert: {
          mqpm_id?: number;
          employee_id: number;
          account_id: number;
          qa_coach_employee_id?: number | null;
          performance_month: string;
          mtd_qa_average?: number | null;
          product_score?: number | null;
          penalty?: number | null;
          score_difference?: number | null;
          mqpm_score?: number | null;
          rating?: string | null;
          process_compliance?: number | null;
          failed_evaluations?: number | null;
          previous_mqpm_score?: number | null;
          previous_score_difference?: number | null;
          opportunities?: string | null;
        };
        Update: {
          mqpm_id?: number;
          employee_id?: number;
          account_id?: number;
          qa_coach_employee_id?: number | null;
          performance_month?: string;
          mtd_qa_average?: number | null;
          product_score?: number | null;
          penalty?: number | null;
          score_difference?: number | null;
          mqpm_score?: number | null;
          rating?: string | null;
          process_compliance?: number | null;
          failed_evaluations?: number | null;
          previous_mqpm_score?: number | null;
          previous_score_difference?: number | null;
          opportunities?: string | null;
        };
        Relationships: [];
      };
      assignment_reporting: {
        Row: {
          id: number;
          employee_assignment_id: number;
          relationship_type: string;
          supervisor_employee_id: number;
          effective_from: string | null;
          effective_to: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          employee_assignment_id: number;
          relationship_type: string;
          supervisor_employee_id: number;
          effective_from?: string | null;
          effective_to?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          employee_assignment_id?: number;
          relationship_type?: string;
          supervisor_employee_id?: number;
          effective_from?: string | null;
          effective_to?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      agent_assignments: {
        Row: {
          assignment_id: number;
          agent_employee_id: number;
          account_id: number;
          lob_id: number;
          team_lead_employee_id: number;
          qa_coach_employee_id: number;
          qa_evaluator_employee_id: number;
          effective_from: string | null;
          effective_to: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          assignment_id?: number;
          agent_employee_id: number;
          account_id: number;
          lob_id: number;
          team_lead_employee_id: number;
          qa_coach_employee_id: number;
          qa_evaluator_employee_id: number;
          effective_from?: string | null;
          effective_to?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          assignment_id?: number;
          agent_employee_id?: number;
          account_id?: number;
          lob_id?: number;
          team_lead_employee_id?: number;
          qa_coach_employee_id?: number;
          qa_evaluator_employee_id?: number;
          effective_from?: string | null;
          effective_to?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
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

// Convenience aliases for the quality tables.
export type Evaluation = Tables<"evaluations">;
export type EvaluationParameter = Tables<"evaluation_parameters">;
export type RmCover = Tables<"rm_covers">;
export type RmMqpmPerformance = Tables<"rm_mqpm_performance">;
export type Status = Tables<"statuses">;
export type AssignmentReporting = Tables<"assignment_reporting">;
export type AgentAssignment = Tables<"agent_assignments">;
