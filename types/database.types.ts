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
  public: {
    Tables: {
      ai_generations: {
        Row: {
          compute_time_ms: number | null
          cost_credits: number
          created_at: string
          engine_model: string
          error_log: string | null
          id: string
          mockup_id: string | null
          prompt: string | null
          status: Database["public"]["Enums"]["generation_status"]
          user_id: string
        }
        Insert: {
          compute_time_ms?: number | null
          cost_credits: number
          created_at?: string
          engine_model: string
          error_log?: string | null
          id?: string
          mockup_id?: string | null
          prompt?: string | null
          status?: Database["public"]["Enums"]["generation_status"]
          user_id: string
        }
        Update: {
          compute_time_ms?: number | null
          cost_credits?: number
          created_at?: string
          engine_model?: string
          error_log?: string | null
          id?: string
          mockup_id?: string | null
          prompt?: string | null
          status?: Database["public"]["Enums"]["generation_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_generations_mockup_id_fkey"
            columns: ["mockup_id"]
            isOneToOne: false
            referencedRelation: "mockups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          created_at: string
          height: number | null
          id: string
          is_public: boolean
          storage_path: string
          type: Database["public"]["Enums"]["asset_type"]
          user_id: string
          width: number | null
        }
        Insert: {
          created_at?: string
          height?: number | null
          id?: string
          is_public?: boolean
          storage_path: string
          type: Database["public"]["Enums"]["asset_type"]
          user_id: string
          width?: number | null
        }
        Update: {
          created_at?: string
          height?: number | null
          id?: string
          is_public?: boolean
          storage_path?: string
          type?: Database["public"]["Enums"]["asset_type"]
          user_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          created_at: string | null
          description: string
          icon_url: string
          id: string
          name: string
          xp_bonus: number | null
        }
        Insert: {
          created_at?: string | null
          description: string
          icon_url: string
          id: string
          name: string
          xp_bonus?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string
          icon_url?: string
          id?: string
          name?: string
          xp_bonus?: number | null
        }
        Relationships: []
      }
      mockup_versions: {
        Row: {
          canvas_state: Json
          created_at: string
          id: string
          mockup_id: string
          user_id: string
        }
        Insert: {
          canvas_state: Json
          created_at?: string
          id?: string
          mockup_id: string
          user_id: string
        }
        Update: {
          canvas_state?: Json
          created_at?: string
          id?: string
          mockup_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mockup_versions_mockup_id_fkey"
            columns: ["mockup_id"]
            isOneToOne: false
            referencedRelation: "mockups"
            referencedColumns: ["id"]
          },
        ]
      }
      mockups: {
        Row: {
          canvas_state: Json
          created_at: string
          high_res_path: string | null
          id: string
          is_public: boolean
          likes: number
          logo_id: string | null
          product_id: string | null
          prompt: string | null
          status: Database["public"]["Enums"]["generation_status"]
          storage_path: string | null
          thumbnail_path: string | null
          title: string
          user_id: string
          views: number
        }
        Insert: {
          canvas_state?: Json
          created_at?: string
          high_res_path?: string | null
          id?: string
          is_public?: boolean
          likes?: number
          logo_id?: string | null
          product_id?: string | null
          prompt?: string | null
          status?: Database["public"]["Enums"]["generation_status"]
          storage_path?: string | null
          thumbnail_path?: string | null
          title?: string
          user_id: string
          views?: number
        }
        Update: {
          canvas_state?: Json
          created_at?: string
          high_res_path?: string | null
          id?: string
          is_public?: boolean
          likes?: number
          logo_id?: string | null
          product_id?: string | null
          prompt?: string | null
          status?: Database["public"]["Enums"]["generation_status"]
          storage_path?: string | null
          thumbnail_path?: string | null
          title?: string
          user_id?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "mockups_logo_id_fkey"
            columns: ["logo_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mockups_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mockups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banned_until: string | null
          brand_palette: Json | null
          created_at: string
          credits: number
          email: string
          full_name: string | null
          id: string
          preferences: Json | null
          role: Database["public"]["Enums"]["user_role"]
          status: string
          total_renders: number
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          banned_until?: string | null
          brand_palette?: Json | null
          created_at?: string
          credits?: number
          email: string
          full_name?: string | null
          id: string
          preferences?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
          total_renders?: number
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          banned_until?: string | null
          brand_palette?: Json | null
          created_at?: string
          credits?: number
          email?: string
          full_name?: string | null
          id?: string
          preferences?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
          total_renders?: number
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      studio_assets: {
        Row: {
          created_at: string
          id: string
          is_public: boolean
          metadata: Json | null
          name: string
          storage_path: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_public?: boolean
          metadata?: Json | null
          name: string
          storage_path: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_public?: boolean
          metadata?: Json | null
          name?: string
          storage_path?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          status: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          status?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          status?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_messages: {
        Row: {
          created_at: string
          id: string
          is_internal: boolean
          message: string
          ticket_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_internal?: boolean
          message: string
          ticket_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_internal?: boolean
          message?: string
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          category: string
          created_at: string
          id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          awarded_at: string | null
          badge_id: string
          id: string
          user_id: string
        }
        Insert: {
          awarded_at?: string | null
          badge_id: string
          id?: string
          user_id: string
        }
        Update: {
          awarded_at?: string | null
          badge_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_unread_count: { Args: { user_uuid: string }; Returns: number }
      get_user_email_by_username: {
        Args: { lookup_username: string }
        Returns: string
      }
    }
    Enums: {
      account_status: "active" | "banned" | "suspended"
      admin_action:
        | "BAN"
        | "SUSPEND"
        | "UNBAN"
        | "DELETE_CONTENT"
        | "ROLE_CHANGE"
      asset_type: "product" | "logo"
      difficulty_level:
        | "BEGINNER"
        | "INTERMEDIATE"
        | "ADVANCED"
        | "MASTER"
        | "FUNDAMENTALS"
      generation_status: "pending" | "processing" | "completed" | "failed"
      presence_status: "ONLINE" | "OFFLINE" | "BUSY"
      subscription_tier: "free" | "pro" | "ultra"
      ticket_priority: "low" | "medium" | "high"
      ticket_status:
        | "open"
        | "underreview"
        | "in_progress"
        | "resolved"
        | "closed"
      user_role: "member" | "premium" | "moderator" | "admin"
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
      account_status: ["active", "banned", "suspended"],
      admin_action: [
        "BAN",
        "SUSPEND",
        "UNBAN",
        "DELETE_CONTENT",
        "ROLE_CHANGE",
      ],
      asset_type: ["product", "logo"],
      difficulty_level: [
        "BEGINNER",
        "INTERMEDIATE",
        "ADVANCED",
        "MASTER",
        "FUNDAMENTALS",
      ],
      generation_status: ["pending", "processing", "completed", "failed"],
      presence_status: ["ONLINE", "OFFLINE", "BUSY"],
      subscription_tier: ["free", "pro", "ultra"],
      ticket_priority: ["low", "medium", "high"],
      ticket_status: [
        "open",
        "underreview",
        "in_progress",
        "resolved",
        "closed",
      ],
      user_role: ["member", "premium", "moderator", "admin"],
    },
  },
} as const
