export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          created_at: string
          department: string
          description: string | null
          id: string
          lat: number | null
          lng: number | null
          location: string
          name: string
          responsible_employee_id: string | null
          scheduled_date: string
          scheme_code: string | null
        }
        Insert: {
          created_at?: string
          department: string
          description?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          location: string
          name: string
          responsible_employee_id?: string | null
          scheduled_date?: string
          scheme_code?: string | null
        }
        Update: {
          created_at?: string
          department?: string
          description?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          location?: string
          name?: string
          responsible_employee_id?: string | null
          scheduled_date?: string
          scheme_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_responsible_employee_id_fkey"
            columns: ["responsible_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_evidence: {
        Row: {
          caption: string | null
          captured_at: string
          id: string
          inspection_id: string
          lat: number | null
          lng: number | null
          media_type: string
          media_url: string
        }
        Insert: {
          caption?: string | null
          captured_at?: string
          id?: string
          inspection_id: string
          lat?: number | null
          lng?: number | null
          media_type?: string
          media_url: string
        }
        Update: {
          caption?: string | null
          captured_at?: string
          id?: string
          inspection_id?: string
          lat?: number | null
          lng?: number | null
          media_type?: string
          media_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_evidence_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          check_in_at: string | null
          check_in_face_captured: boolean
          check_in_lat: number | null
          check_in_lng: number | null
          check_out_at: string | null
          check_out_face_captured: boolean
          check_out_lat: number | null
          check_out_lng: number | null
          created_at: string
          employee_id: string
          gps_valid: boolean
          id: string
          is_late: boolean
          missing_checkout: boolean
          notes: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          work_date: string
          working_hours: number
        }
        Insert: {
          check_in_at?: string | null
          check_in_face_captured?: boolean
          check_in_lat?: number | null
          check_in_lng?: number | null
          check_out_at?: string | null
          check_out_face_captured?: boolean
          check_out_lat?: number | null
          check_out_lng?: number | null
          created_at?: string
          employee_id: string
          gps_valid?: boolean
          id?: string
          is_late?: boolean
          missing_checkout?: boolean
          notes?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          work_date?: string
          working_hours?: number
        }
        Update: {
          check_in_at?: string | null
          check_in_face_captured?: boolean
          check_in_lat?: number | null
          check_in_lng?: number | null
          check_out_at?: string | null
          check_out_face_captured?: boolean
          check_out_lat?: number | null
          check_out_lng?: number | null
          created_at?: string
          employee_id?: string
          gps_valid?: boolean
          id?: string
          is_late?: boolean
          missing_checkout?: boolean
          notes?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          work_date?: string
          working_hours?: number
        }
        Relationships: [
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_verifications: {
        Row: {
          attendance_id: string
          face_captured: boolean
          id: string
          lat: number | null
          lng: number | null
          passed: boolean | null
          reason: string | null
          requested_at: string
          responded_at: string | null
        }
        Insert: {
          attendance_id: string
          face_captured?: boolean
          id?: string
          lat?: number | null
          lng?: number | null
          passed?: boolean | null
          reason?: string | null
          requested_at?: string
          responded_at?: string | null
        }
        Update: {
          attendance_id?: string
          face_captured?: boolean
          id?: string
          lat?: number | null
          lng?: number | null
          passed?: boolean | null
          reason?: string | null
          requested_at?: string
          responded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_verifications_attendance_id_fkey"
            columns: ["attendance_id"]
            isOneToOne: false
            referencedRelation: "attendance"
            referencedColumns: ["id"]
          },
        ]
      }
      beneficiaries: {
        Row: {
          contact: string | null
          created_at: string
          full_name: string
          id: string
          inspection_id: string
          remarks: string | null
        }
        Insert: {
          contact?: string | null
          created_at?: string
          full_name: string
          id?: string
          inspection_id: string
          remarks?: string | null
        }
        Update: {
          contact?: string | null
          created_at?: string
          full_name?: string
          id?: string
          inspection_id?: string
          remarks?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "beneficiaries_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string
          department: string
          designation: string
          employee_code: string
          expected_lat: number
          expected_lng: number
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          posting_location: string
        }
        Insert: {
          created_at?: string
          department: string
          designation: string
          employee_code: string
          expected_lat: number
          expected_lng: number
          full_name: string
          id?: string
          is_active?: boolean
          phone?: string | null
          posting_location: string
        }
        Update: {
          created_at?: string
          department?: string
          designation?: string
          employee_code?: string
          expected_lat?: number
          expected_lng?: number
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          posting_location?: string
        }
        Relationships: []
      }
      inspections: {
        Row: {
          activity_id: string
          beneficiary_count: number
          captured_at: string
          created_at: string
          id: string
          inspected_by: string | null
          inspector_employee_id: string | null
          lat: number | null
          lng: number | null
          notes: string | null
          stage: Database["public"]["Enums"]["timeline_stage"]
          status: Database["public"]["Enums"]["inspection_status"]
          submitted_at: string | null
          verified_at: string | null
        }
        Insert: {
          activity_id: string
          beneficiary_count?: number
          captured_at?: string
          created_at?: string
          id?: string
          inspected_by?: string | null
          inspector_employee_id?: string | null
          lat?: number | null
          lng?: number | null
          notes?: string | null
          stage?: Database["public"]["Enums"]["timeline_stage"]
          status?: Database["public"]["Enums"]["inspection_status"]
          submitted_at?: string | null
          verified_at?: string | null
        }
        Update: {
          activity_id?: string
          beneficiary_count?: number
          captured_at?: string
          created_at?: string
          id?: string
          inspected_by?: string | null
          inspector_employee_id?: string | null
          lat?: number | null
          lng?: number | null
          notes?: string | null
          stage?: Database["public"]["Enums"]["timeline_stage"]
          status?: Database["public"]["Enums"]["inspection_status"]
          submitted_at?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspections_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_inspector_employee_id_fkey"
            columns: ["inspector_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          department: string | null
          designation: string | null
          email: string | null
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          designation?: string | null
          email?: string | null
          full_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          designation?: string | null
          email?: string | null
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "officer" | "staff"
      attendance_status: "verified" | "requires_review" | "inspection_priority"
      inspection_status: "completed" | "partially_completed" | "not_verified"
      timeline_stage: "created" | "evidence_captured" | "submitted" | "verified"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "officer", "staff"],
      attendance_status: ["verified", "requires_review", "inspection_priority"],
      inspection_status: ["completed", "partially_completed", "not_verified"],
      timeline_stage: ["created", "evidence_captured", "submitted", "verified"],
    },
  },
} as const
