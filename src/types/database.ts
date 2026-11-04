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
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_calls: {
        Row: {
          created_at: string
          fn: string
          id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          fn: string
          id?: never
          user_id: string
        }
        Update: {
          created_at?: string
          fn?: string
          id?: never
          user_id?: string
        }
        Relationships: []
      }
      app_events: {
        Row: {
          created_at: string
          event: string
          id: number
          props: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          event: string
          id?: never
          props?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          event?: string
          id?: never
          props?: Json
          user_id?: string
        }
        Relationships: []
      }
      garmin_activities: {
        Row: {
          active_kcal: number | null
          activity_id: string | null
          activity_name: string | null
          activity_type: string | null
          avg_hr: number | null
          device_name: string | null
          distance_m: number | null
          duration_sec: number | null
          manual: boolean | null
          max_hr: number | null
          parent_summary_id: string | null
          start_offset_sec: number | null
          start_time: string | null
          steps: number | null
          summary_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active_kcal?: number | null
          activity_id?: string | null
          activity_name?: string | null
          activity_type?: string | null
          avg_hr?: number | null
          device_name?: string | null
          distance_m?: number | null
          duration_sec?: number | null
          manual?: boolean | null
          max_hr?: number | null
          parent_summary_id?: string | null
          start_offset_sec?: number | null
          start_time?: string | null
          steps?: number | null
          summary_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active_kcal?: number | null
          activity_id?: string | null
          activity_name?: string | null
          activity_type?: string | null
          avg_hr?: number | null
          device_name?: string | null
          distance_m?: number | null
          duration_sec?: number | null
          manual?: boolean | null
          max_hr?: number | null
          parent_summary_id?: string | null
          start_offset_sec?: number | null
          start_time?: string | null
          steps?: number | null
          summary_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      garmin_connections: {
        Row: {
          access_expires_at: string
          access_token: string
          confirm_expires_at: string | null
          confirm_nonce: string | null
          connected_at: string
          garmin_user_id: string
          permissions: string[]
          refresh_expires_at: string
          refresh_token: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_expires_at: string
          access_token: string
          confirm_expires_at?: string | null
          confirm_nonce?: string | null
          connected_at?: string
          garmin_user_id: string
          permissions?: string[]
          refresh_expires_at: string
          refresh_token: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_expires_at?: string
          access_token?: string
          confirm_expires_at?: string | null
          confirm_nonce?: string | null
          connected_at?: string
          garmin_user_id?: string
          permissions?: string[]
          refresh_expires_at?: string
          refresh_token?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      garmin_daily: {
        Row: {
          active_kcal: number | null
          activity_stress_sec: number | null
          avg_stress: number | null
          bmr_kcal: number | null
          body_battery_charged: number | null
          body_battery_drained: number | null
          calendar_date: string
          distance_m: number | null
          duration_sec: number
          floors_climbed: number | null
          max_hr: number | null
          max_stress: number | null
          min_hr: number | null
          moderate_sec: number | null
          rest_stress_sec: number | null
          resting_hr: number | null
          start_offset_sec: number | null
          start_time: string | null
          steps: number | null
          stress_qualifier: string | null
          stress_sec: number | null
          summary_id: string | null
          updated_at: string
          user_id: string
          vigorous_sec: number | null
        }
        Insert: {
          active_kcal?: number | null
          activity_stress_sec?: number | null
          avg_stress?: number | null
          bmr_kcal?: number | null
          body_battery_charged?: number | null
          body_battery_drained?: number | null
          calendar_date: string
          distance_m?: number | null
          duration_sec?: number
          floors_climbed?: number | null
          max_hr?: number | null
          max_stress?: number | null
          min_hr?: number | null
          moderate_sec?: number | null
          rest_stress_sec?: number | null
          resting_hr?: number | null
          start_offset_sec?: number | null
          start_time?: string | null
          steps?: number | null
          stress_qualifier?: string | null
          stress_sec?: number | null
          summary_id?: string | null
          updated_at?: string
          user_id: string
          vigorous_sec?: number | null
        }
        Update: {
          active_kcal?: number | null
          activity_stress_sec?: number | null
          avg_stress?: number | null
          bmr_kcal?: number | null
          body_battery_charged?: number | null
          body_battery_drained?: number | null
          calendar_date?: string
          distance_m?: number | null
          duration_sec?: number
          floors_climbed?: number | null
          max_hr?: number | null
          max_stress?: number | null
          min_hr?: number | null
          moderate_sec?: number | null
          rest_stress_sec?: number | null
          resting_hr?: number | null
          start_offset_sec?: number | null
          start_time?: string | null
          steps?: number | null
          stress_qualifier?: string | null
          stress_sec?: number | null
          summary_id?: string | null
          updated_at?: string
          user_id?: string
          vigorous_sec?: number | null
        }
        Relationships: []
      }
      garmin_hrv: {
        Row: {
          calendar_date: string
          duration_sec: number | null
          last_night_5min_high: number | null
          last_night_avg: number | null
          start_offset_sec: number | null
          start_time: string | null
          summary_id: string | null
          updated_at: string
          user_id: string
          values_5min: Json | null
        }
        Insert: {
          calendar_date: string
          duration_sec?: number | null
          last_night_5min_high?: number | null
          last_night_avg?: number | null
          start_offset_sec?: number | null
          start_time?: string | null
          summary_id?: string | null
          updated_at?: string
          user_id: string
          values_5min?: Json | null
        }
        Update: {
          calendar_date?: string
          duration_sec?: number | null
          last_night_5min_high?: number | null
          last_night_avg?: number | null
          start_offset_sec?: number | null
          start_time?: string | null
          summary_id?: string | null
          updated_at?: string
          user_id?: string
          values_5min?: Json | null
        }
        Relationships: []
      }
      garmin_hydration: {
        Row: {
          calendar_date: string
          fluid_ml: number | null
          summary_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          calendar_date: string
          fluid_ml?: number | null
          summary_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          calendar_date?: string
          fluid_ml?: number | null
          summary_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      garmin_oauth_states: {
        Row: {
          code_verifier: string
          created_at: string
          state: string
          user_id: string
        }
        Insert: {
          code_verifier: string
          created_at?: string
          state: string
          user_id: string
        }
        Update: {
          code_verifier?: string
          created_at?: string
          state?: string
          user_id?: string
        }
        Relationships: []
      }
      garmin_sleep: {
        Row: {
          awake_sec: number | null
          calendar_date: string
          deep_sec: number | null
          duration_sec: number
          light_sec: number | null
          nap_sec: number | null
          rem_sec: number | null
          sleep_quality: string | null
          sleep_score: number | null
          start_offset_sec: number | null
          start_time: string
          summary_id: string | null
          unmeasurable_sec: number | null
          updated_at: string
          user_id: string
          validation: string | null
        }
        Insert: {
          awake_sec?: number | null
          calendar_date: string
          deep_sec?: number | null
          duration_sec?: number
          light_sec?: number | null
          nap_sec?: number | null
          rem_sec?: number | null
          sleep_quality?: string | null
          sleep_score?: number | null
          start_offset_sec?: number | null
          start_time: string
          summary_id?: string | null
          unmeasurable_sec?: number | null
          updated_at?: string
          user_id: string
          validation?: string | null
        }
        Update: {
          awake_sec?: number | null
          calendar_date?: string
          deep_sec?: number | null
          duration_sec?: number
          light_sec?: number | null
          nap_sec?: number | null
          rem_sec?: number | null
          sleep_quality?: string | null
          sleep_score?: number | null
          start_offset_sec?: number | null
          start_time?: string
          summary_id?: string | null
          unmeasurable_sec?: number | null
          updated_at?: string
          user_id?: string
          validation?: string | null
        }
        Relationships: []
      }
      garmin_stress: {
        Row: {
          body_battery_values: Json | null
          calendar_date: string
          duration_sec: number | null
          start_offset_sec: number | null
          start_time: string
          stress_values: Json | null
          summary_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body_battery_values?: Json | null
          calendar_date: string
          duration_sec?: number | null
          start_offset_sec?: number | null
          start_time: string
          stress_values?: Json | null
          summary_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body_battery_values?: Json | null
          calendar_date?: string
          duration_sec?: number | null
          start_offset_sec?: number | null
          start_time?: string
          stress_values?: Json | null
          summary_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      garmin_user_metrics: {
        Row: {
          calendar_date: string
          enhanced: boolean | null
          fitness_age: number | null
          summary_id: string | null
          updated_at: string
          user_id: string
          vo2_max: number | null
          vo2_max_cycling: number | null
        }
        Insert: {
          calendar_date: string
          enhanced?: boolean | null
          fitness_age?: number | null
          summary_id?: string | null
          updated_at?: string
          user_id: string
          vo2_max?: number | null
          vo2_max_cycling?: number | null
        }
        Update: {
          calendar_date?: string
          enhanced?: boolean | null
          fitness_age?: number | null
          summary_id?: string | null
          updated_at?: string
          user_id?: string
          vo2_max?: number | null
          vo2_max_cycling?: number | null
        }
        Relationships: []
      }
      life_events: {
        Row: {
          created_at: string | null
          date: string
          event_type: string
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          event_type: string
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          event_type?: string
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      readiness_scores: {
        Row: {
          ai_explanation: string | null
          ai_summary: string | null
          ai_tip: string | null
          algorithm_version: string | null
          created_at: string
          date: string
          generated_at: string | null
          hrv: number | null
          hrv_source: string | null
          id: string
          recommendation: string | null
          recovery_score: number | null
          rhr: number | null
          score: number
          score_delta: number | null
          sleep_duration: number | null
          sleep_efficiency: number | null
          sleep_score: number | null
          snapshot_id: string | null
          stress_score: number | null
          trend: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_explanation?: string | null
          ai_summary?: string | null
          ai_tip?: string | null
          algorithm_version?: string | null
          created_at?: string
          date: string
          generated_at?: string | null
          hrv?: number | null
          hrv_source?: string | null
          id?: string
          recommendation?: string | null
          recovery_score?: number | null
          rhr?: number | null
          score: number
          score_delta?: number | null
          sleep_duration?: number | null
          sleep_efficiency?: number | null
          sleep_score?: number | null
          snapshot_id?: string | null
          stress_score?: number | null
          trend?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_explanation?: string | null
          ai_summary?: string | null
          ai_tip?: string | null
          algorithm_version?: string | null
          created_at?: string
          date?: string
          generated_at?: string | null
          hrv?: number | null
          hrv_source?: string | null
          id?: string
          recommendation?: string | null
          recovery_score?: number | null
          rhr?: number | null
          score?: number
          score_delta?: number | null
          sleep_duration?: number | null
          sleep_efficiency?: number | null
          sleep_score?: number | null
          snapshot_id?: string | null
          stress_score?: number | null
          trend?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          age: number | null
          device_type: string | null
          height_cm: number | null
          name: string | null
          onboarded_at: string | null
          primary_goal: string | null
          sex: string | null
          training_frequency: string | null
          updated_at: string | null
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          age?: number | null
          device_type?: string | null
          height_cm?: number | null
          name?: string | null
          onboarded_at?: string | null
          primary_goal?: string | null
          sex?: string | null
          training_frequency?: string | null
          updated_at?: string | null
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          age?: number | null
          device_type?: string | null
          height_cm?: number | null
          name?: string | null
          onboarded_at?: string | null
          primary_goal?: string | null
          sex?: string | null
          training_frequency?: string | null
          updated_at?: string | null
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      garmin_connection_status: {
        Row: {
          connected_at: string | null
          garmin_user_id: string | null
          permissions: string[] | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          connected_at?: string | null
          garmin_user_id?: string | null
          permissions?: string[] | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          connected_at?: string | null
          garmin_user_id?: string | null
          permissions?: string[] | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
