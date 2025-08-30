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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      event_markets: {
        Row: {
          category_id: string
          change_24h: number
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string
          featured_order: number | null
          id: string
          is_active: boolean
          is_featured: boolean
          is_new: boolean
          is_trending: boolean
          liquidity: number
          market_format: string | null
          market_structure: string | null
          market_type: string
          maximum_bet: number | null
          minimum_bet: number
          name: string
          no_price: number
          options_count: number | null
          participants_count: number | null
          relevance: string | null
          resolution_date: string | null
          resolution_notes: string | null
          resolution_status: Database["public"]["Enums"]["resolution_status"]
          resolved_value: boolean | null
          sort_order: number
          subcategory_id: string | null
          total_shares: number
          updated_at: string
          volume: number
          why_it_matters: string | null
          yes_price: number
        }
        Insert: {
          category_id: string
          change_24h?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date: string
          featured_order?: number | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          is_new?: boolean
          is_trending?: boolean
          liquidity?: number
          market_format?: string | null
          market_structure?: string | null
          market_type?: string
          maximum_bet?: number | null
          minimum_bet?: number
          name: string
          no_price?: number
          options_count?: number | null
          participants_count?: number | null
          relevance?: string | null
          resolution_date?: string | null
          resolution_notes?: string | null
          resolution_status?: Database["public"]["Enums"]["resolution_status"]
          resolved_value?: boolean | null
          sort_order?: number
          subcategory_id?: string | null
          total_shares?: number
          updated_at?: string
          volume?: number
          why_it_matters?: string | null
          yes_price?: number
        }
        Update: {
          category_id?: string
          change_24h?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string
          featured_order?: number | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          is_new?: boolean
          is_trending?: boolean
          liquidity?: number
          market_format?: string | null
          market_structure?: string | null
          market_type?: string
          maximum_bet?: number | null
          minimum_bet?: number
          name?: string
          no_price?: number
          options_count?: number | null
          participants_count?: number | null
          relevance?: string | null
          resolution_date?: string | null
          resolution_notes?: string | null
          resolution_status?: Database["public"]["Enums"]["resolution_status"]
          resolved_value?: boolean | null
          sort_order?: number
          subcategory_id?: string | null
          total_shares?: number
          updated_at?: string
          volume?: number
          why_it_matters?: string | null
          yes_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_markets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "market_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_markets_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "market_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      market_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      market_options: {
        Row: {
          candidate_avatar: string | null
          candidate_metadata: Json | null
          candidate_name: string | null
          candidate_party: string | null
          created_at: string
          current_price: number
          id: string
          is_active: boolean
          market_id: string
          option_name: string
          option_type: string
          sort_order: number | null
          total_shares: number
          updated_at: string
        }
        Insert: {
          candidate_avatar?: string | null
          candidate_metadata?: Json | null
          candidate_name?: string | null
          candidate_party?: string | null
          created_at?: string
          current_price?: number
          id?: string
          is_active?: boolean
          market_id: string
          option_name: string
          option_type: string
          sort_order?: number | null
          total_shares?: number
          updated_at?: string
        }
        Update: {
          candidate_avatar?: string | null
          candidate_metadata?: Json | null
          candidate_name?: string | null
          candidate_party?: string | null
          created_at?: string
          current_price?: number
          id?: string
          is_active?: boolean
          market_id?: string
          option_name?: string
          option_type?: string
          sort_order?: number | null
          total_shares?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_options_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "event_markets"
            referencedColumns: ["id"]
          },
        ]
      }
      market_price_history: {
        Row: {
          created_at: string
          id: string
          market_id: string
          option_id: string
          price: number
          timestamp: string
          volume: number
        }
        Insert: {
          created_at?: string
          id?: string
          market_id: string
          option_id: string
          price: number
          timestamp?: string
          volume?: number
        }
        Update: {
          created_at?: string
          id?: string
          market_id?: string
          option_id?: string
          price?: number
          timestamp?: string
          volume?: number
        }
        Relationships: [
          {
            foreignKeyName: "market_price_history_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "event_markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_price_history_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "market_options"
            referencedColumns: ["id"]
          },
        ]
      }
      market_subcategories: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "market_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          background_texture: string | null
          bio: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          email_verified: boolean
          first_name: string | null
          id: string
          is_active: boolean
          last_name: string | null
          location: string | null
          phone: string | null
          theme_preference: string | null
          updated_at: string
          username: string | null
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          background_texture?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          email_verified?: boolean
          first_name?: string | null
          id: string
          is_active?: boolean
          last_name?: string | null
          location?: string | null
          phone?: string | null
          theme_preference?: string | null
          updated_at?: string
          username?: string | null
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          background_texture?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          email_verified?: boolean
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          location?: string | null
          phone?: string | null
          theme_preference?: string | null
          updated_at?: string
          username?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      secrets: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_candidate_binary_options: {
        Args: {
          p_candidate_avatar?: string
          p_candidate_metadata?: Json
          p_candidate_name: string
          p_candidate_party?: string
          p_market_id: string
        }
        Returns: {
          no_option_id: string
          yes_option_id: string
        }[]
      }
      create_default_binary_options: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_processing_state: {
        Args: { process_name_param: string }
        Returns: {
          created_at: string
          last_processed_index: number
          last_updated: string
          process_name: string
          total_items: number
        }[]
      }
    }
    Enums: {
      resolution_status: "open" | "closed" | "resolved" | "cancelled"
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
      resolution_status: ["open", "closed", "resolved", "cancelled"],
    },
  },
} as const
