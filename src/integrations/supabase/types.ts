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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      applicants: {
        Row: {
          created_at: string
          email: string
          id: string
          linkedin_url: string | null
          location: string | null
          name: string
          phone: string | null
          portfolio_url: string | null
          resume_path: string
          skills: string | null
          summary: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          linkedin_url?: string | null
          location?: string | null
          name: string
          phone?: string | null
          portfolio_url?: string | null
          resume_path: string
          skills?: string | null
          summary?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          linkedin_url?: string | null
          location?: string | null
          name?: string
          phone?: string | null
          portfolio_url?: string | null
          resume_path?: string
          skills?: string | null
          summary?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      articles: {
        Row: {
          author_user_id: string
          created_at: string
          id: string
          published_at: string
          summary: string | null
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          author_user_id: string
          created_at?: string
          id?: string
          published_at?: string
          summary?: string | null
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          author_user_id?: string
          created_at?: string
          id?: string
          published_at?: string
          summary?: string | null
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      job_alerts: {
        Row: {
          active: boolean
          cadence: string
          created_at: string
          id: string
          keywords: string | null
          location: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          cadence?: string
          created_at?: string
          id?: string
          keywords?: string | null
          location?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          cadence?: string
          created_at?: string
          id?: string
          keywords?: string | null
          location?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      job_sources: {
        Row: {
          base_url: string
          created_at: string
          id: string
          is_active: boolean | null
          last_scraped_at: string | null
          name: string
          scrape_frequency_hours: number | null
          updated_at: string
        }
        Insert: {
          base_url: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_scraped_at?: string | null
          name: string
          scrape_frequency_hours?: number | null
          updated_at?: string
        }
        Update: {
          base_url?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_scraped_at?: string | null
          name?: string
          scrape_frequency_hours?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          company: string
          created_at: string
          description: string | null
          expires_at: string | null
          external_id: string | null
          id: string
          is_active: boolean | null
          location: string | null
          posted_at: string | null
          remote: boolean | null
          requirements: string | null
          salary_currency: string | null
          salary_max: number | null
          salary_min: number | null
          source: string
          title: string
          type: string | null
          updated_at: string
          url: string
        }
        Insert: {
          company: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          external_id?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          posted_at?: string | null
          remote?: boolean | null
          requirements?: string | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          source: string
          title: string
          type?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          company?: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          external_id?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          posted_at?: string | null
          remote?: boolean | null
          requirements?: string | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          source?: string
          title?: string
          type?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          college_name: string | null
          created_at: string
          education_background: string | null
          full_name: string | null
          id: string
          profile_completed: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          college_name?: string | null
          created_at?: string
          education_background?: string | null
          full_name?: string | null
          id?: string
          profile_completed?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          college_name?: string | null
          created_at?: string
          education_background?: string | null
          full_name?: string | null
          id?: string
          profile_completed?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_jobs: {
        Row: {
          company: string | null
          created_at: string
          id: string
          job_external_id: string
          location: string | null
          posted_at: string | null
          remote: boolean | null
          title: string
          type: string | null
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          id?: string
          job_external_id: string
          location?: string | null
          posted_at?: string | null
          remote?: boolean | null
          title: string
          type?: string | null
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          id?: string
          job_external_id?: string
          location?: string | null
          posted_at?: string | null
          remote?: boolean | null
          title?: string
          type?: string | null
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      user_applications: {
        Row: {
          application_date: string
          applied_through: string | null
          company_name: string | null
          created_at: string
          external_job_id: string | null
          follow_up_date: string | null
          id: string
          interview_date: string | null
          job_id: string | null
          job_title: string | null
          notes: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          application_date?: string
          applied_through?: string | null
          company_name?: string | null
          created_at?: string
          external_job_id?: string | null
          follow_up_date?: string | null
          id?: string
          interview_date?: string | null
          job_id?: string | null
          job_title?: string | null
          notes?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          application_date?: string
          applied_through?: string | null
          company_name?: string | null
          created_at?: string
          external_job_id?: string | null
          follow_up_date?: string | null
          id?: string
          interview_date?: string | null
          job_id?: string | null
          job_title?: string | null
          notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
