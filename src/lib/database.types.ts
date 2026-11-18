import type { Priority, TaskStatus } from "./types";

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
      device_sessions: {
        Row: {
          user_id: string;
          session_id: string;
          device_label: string;
          created_at: string;
          last_seen_at: string;
          revoked_at: string | null;
        };
        Insert: {
          user_id: string;
          session_id: string;
          device_label: string;
          created_at?: string;
          last_seen_at?: string;
          revoked_at?: string | null;
        };
        Update: {
          user_id?: string;
          session_id?: string;
          device_label?: string;
          created_at?: string;
          last_seen_at?: string;
          revoked_at?: string | null;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          color: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          color?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          color?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          status: TaskStatus;
          priority: Priority;
          due_date: string | null;
          reminder_at: string | null;
          project_id: string | null;
          labels: string[];
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          status?: TaskStatus;
          priority?: Priority;
          due_date?: string | null;
          reminder_at?: string | null;
          project_id?: string | null;
          labels?: string[];
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          status?: TaskStatus;
          priority?: Priority;
          due_date?: string | null;
          reminder_at?: string | null;
          project_id?: string | null;
          labels?: string[];
          completed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_current_device_session_active: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      register_device_session: {
        Args: { p_device_label: string };
        Returns: boolean;
      };
      revoke_other_device_sessions: {
        Args: Record<string, never>;
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
