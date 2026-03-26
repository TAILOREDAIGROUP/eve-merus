// Supabase Database type definitions
// Generated from 001_initial_schema.sql

export interface Database {
  public: {
    Tables: {
      libraries: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          updated_at?: string;
        };
      };
      skills: {
        Row: {
          id: string;
          library_id: string;
          name: string;
          description: string;
          trigger_phrases: string[];
          content: string;
          token_count: number;
          line_count: number;
          source_filename: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          library_id: string;
          name: string;
          description: string;
          trigger_phrases?: string[];
          content: string;
          token_count?: number;
          line_count?: number;
          source_filename?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          trigger_phrases?: string[];
          content?: string;
          token_count?: number;
          line_count?: number;
          source_filename?: string | null;
          updated_at?: string;
        };
      };
      test_sets: {
        Row: {
          id: string;
          library_id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          library_id: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          updated_at?: string;
        };
      };
      test_cases: {
        Row: {
          id: string;
          test_set_id: string;
          request_text: string;
          expected_skill: string;
          expected_supporting: string[];
          should_not_trigger: string[];
          difficulty: string;
          cluster_tag: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          test_set_id: string;
          request_text: string;
          expected_skill: string;
          expected_supporting?: string[];
          should_not_trigger?: string[];
          difficulty?: string;
          cluster_tag?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          request_text?: string;
          expected_skill?: string;
          expected_supporting?: string[];
          should_not_trigger?: string[];
          difficulty?: string;
          cluster_tag?: string | null;
        };
      };
      scoring_runs: {
        Row: {
          id: string;
          library_id: string;
          test_set_id: string;
          accuracy: number;
          collision_rate: number;
          total_cases: number;
          correct_count: number;
          collision_count: number;
          wrong_count: number;
          miss_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          library_id: string;
          test_set_id: string;
          accuracy: number;
          collision_rate: number;
          total_cases: number;
          correct_count: number;
          collision_count: number;
          wrong_count: number;
          miss_count: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          accuracy?: number;
          collision_rate?: number;
        };
      };
      scoring_results: {
        Row: {
          id: string;
          run_id: string;
          test_case_id: string;
          triggered_skill: string | null;
          all_triggered: string[];
          confidence: number | null;
          result_type: string;
        };
        Insert: {
          id?: string;
          run_id: string;
          test_case_id: string;
          triggered_skill?: string | null;
          all_triggered?: string[];
          confidence?: number | null;
          result_type: string;
        };
        Update: {
          id?: string;
          triggered_skill?: string | null;
          result_type?: string;
        };
      };
      optimization_runs: {
        Row: {
          id: string;
          library_id: string;
          test_set_id: string;
          status: string;
          iterations_completed: number;
          accuracy_start: number | null;
          accuracy_end: number | null;
          collision_rate_start: number | null;
          collision_rate_end: number | null;
          started_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          library_id: string;
          test_set_id: string;
          status?: string;
          iterations_completed?: number;
          accuracy_start?: number | null;
          accuracy_end?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          status?: string;
          iterations_completed?: number;
          accuracy_end?: number | null;
          collision_rate_end?: number | null;
          completed_at?: string | null;
        };
      };
      experiments: {
        Row: {
          id: string;
          run_id: string;
          skill_id: string;
          change_type: string;
          old_description: string;
          new_description: string;
          accuracy_before: number;
          accuracy_after: number;
          collision_rate_before: number | null;
          collision_rate_after: number | null;
          kept: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          run_id: string;
          skill_id: string;
          change_type: string;
          old_description: string;
          new_description: string;
          accuracy_before: number;
          accuracy_after: number;
          collision_rate_before?: number | null;
          collision_rate_after?: number | null;
          kept: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          kept?: boolean;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
