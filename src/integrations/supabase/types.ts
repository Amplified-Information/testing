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
      companies: {
        Row: {
          created_at: string
          description: string | null
          employee_count: number | null
          founded_year: number | null
          headquarters_city: string | null
          headquarters_country: string | null
          id: string
          industry: string | null
          is_active: boolean
          last_refresh: string | null
          market_cap: number | null
          name: string
          sector: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          employee_count?: number | null
          founded_year?: number | null
          headquarters_city?: string | null
          headquarters_country?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean
          last_refresh?: string | null
          market_cap?: number | null
          name: string
          sector?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          employee_count?: number | null
          founded_year?: number | null
          headquarters_city?: string | null
          headquarters_country?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean
          last_refresh?: string | null
          market_cap?: number | null
          name?: string
          sector?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      current_holdings: {
        Row: {
          buy_date: string | null
          buy_price: number | null
          change_percent: number | null
          company_name: string
          created_at: string
          id: string
          performance: number | null
          price: number
          sort_order: number | null
          ticker: string
          updated_at: string
        }
        Insert: {
          buy_date?: string | null
          buy_price?: number | null
          change_percent?: number | null
          company_name: string
          created_at?: string
          id?: string
          performance?: number | null
          price?: number
          sort_order?: number | null
          ticker: string
          updated_at?: string
        }
        Update: {
          buy_date?: string | null
          buy_price?: number | null
          change_percent?: number | null
          company_name?: string
          created_at?: string
          id?: string
          performance?: number | null
          price?: number
          sort_order?: number | null
          ticker?: string
          updated_at?: string
        }
        Relationships: []
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
      market_data_cache: {
        Row: {
          data: Json
          data_type: string
          id: string
          last_updated: string
          stock_id: string
        }
        Insert: {
          data: Json
          data_type: string
          id?: string
          last_updated?: string
          stock_id: string
        }
        Update: {
          data?: Json
          data_type?: string
          id?: string
          last_updated?: string
          stock_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_data_cache_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "nasdaq_stocks"
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
      market_trend_predictions: {
        Row: {
          actual_performance_30d: number | null
          company_name: string
          confidence_score: number
          created_at: string
          id: string
          prediction_accuracy: number | null
          prediction_date: string
          prediction_rationale: string
          symbol: string
          updated_at: string
        }
        Insert: {
          actual_performance_30d?: number | null
          company_name: string
          confidence_score: number
          created_at?: string
          id?: string
          prediction_accuracy?: number | null
          prediction_date?: string
          prediction_rationale: string
          symbol: string
          updated_at?: string
        }
        Update: {
          actual_performance_30d?: number | null
          company_name?: string
          confidence_score?: number
          created_at?: string
          id?: string
          prediction_accuracy?: number | null
          prediction_date?: string
          prediction_rationale?: string
          symbol?: string
          updated_at?: string
        }
        Relationships: []
      }
      nasdaq_stock_fundamentals: {
        Row: {
          company_name: string
          country: string | null
          created_at: string
          description: string | null
          dividend_yield: number | null
          earnings_per_share: number | null
          ebitda: number | null
          ev_to_ebitda: number | null
          ev_to_revenue: number | null
          fiscal_year_end: string | null
          forward_pe: number | null
          id: string
          industry: string | null
          last_updated: string
          latest_quarter: string | null
          market_capitalization: number | null
          operating_margin_ttm: number | null
          pe_ratio: number | null
          peg_ratio: number | null
          price_to_book_ratio: number | null
          price_to_sales_ratio_ttm: number | null
          profit_margin: number | null
          quarterly_earnings_growth_yoy: number | null
          quarterly_revenue_growth_yoy: number | null
          return_on_assets_ttm: number | null
          return_on_equity_ttm: number | null
          revenue_per_share_ttm: number | null
          sector: string | null
          shares_outstanding: number | null
          stock_id: string
          ticker: string
        }
        Insert: {
          company_name: string
          country?: string | null
          created_at?: string
          description?: string | null
          dividend_yield?: number | null
          earnings_per_share?: number | null
          ebitda?: number | null
          ev_to_ebitda?: number | null
          ev_to_revenue?: number | null
          fiscal_year_end?: string | null
          forward_pe?: number | null
          id?: string
          industry?: string | null
          last_updated?: string
          latest_quarter?: string | null
          market_capitalization?: number | null
          operating_margin_ttm?: number | null
          pe_ratio?: number | null
          peg_ratio?: number | null
          price_to_book_ratio?: number | null
          price_to_sales_ratio_ttm?: number | null
          profit_margin?: number | null
          quarterly_earnings_growth_yoy?: number | null
          quarterly_revenue_growth_yoy?: number | null
          return_on_assets_ttm?: number | null
          return_on_equity_ttm?: number | null
          revenue_per_share_ttm?: number | null
          sector?: string | null
          shares_outstanding?: number | null
          stock_id: string
          ticker: string
        }
        Update: {
          company_name?: string
          country?: string | null
          created_at?: string
          description?: string | null
          dividend_yield?: number | null
          earnings_per_share?: number | null
          ebitda?: number | null
          ev_to_ebitda?: number | null
          ev_to_revenue?: number | null
          fiscal_year_end?: string | null
          forward_pe?: number | null
          id?: string
          industry?: string | null
          last_updated?: string
          latest_quarter?: string | null
          market_capitalization?: number | null
          operating_margin_ttm?: number | null
          pe_ratio?: number | null
          peg_ratio?: number | null
          price_to_book_ratio?: number | null
          price_to_sales_ratio_ttm?: number | null
          profit_margin?: number | null
          quarterly_earnings_growth_yoy?: number | null
          quarterly_revenue_growth_yoy?: number | null
          return_on_assets_ttm?: number | null
          return_on_equity_ttm?: number | null
          revenue_per_share_ttm?: number | null
          sector?: string | null
          shares_outstanding?: number | null
          stock_id?: string
          ticker?: string
        }
        Relationships: [
          {
            foreignKeyName: "nasdaq_stock_fundamentals_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "nasdaq_stocks"
            referencedColumns: ["id"]
          },
        ]
      }
      nasdaq_stock_quotes: {
        Row: {
          change_amount: number | null
          change_percent: number | null
          high_52_week: number | null
          id: string
          last_trading_day: string | null
          last_updated: string | null
          low_52_week: number | null
          open_price: number | null
          previous_close: number | null
          price: number | null
          stock_id: string
          timestamp: string | null
          volume: number | null
        }
        Insert: {
          change_amount?: number | null
          change_percent?: number | null
          high_52_week?: number | null
          id?: string
          last_trading_day?: string | null
          last_updated?: string | null
          low_52_week?: number | null
          open_price?: number | null
          previous_close?: number | null
          price?: number | null
          stock_id: string
          timestamp?: string | null
          volume?: number | null
        }
        Update: {
          change_amount?: number | null
          change_percent?: number | null
          high_52_week?: number | null
          id?: string
          last_trading_day?: string | null
          last_updated?: string | null
          low_52_week?: number | null
          open_price?: number | null
          previous_close?: number | null
          price?: number | null
          stock_id?: string
          timestamp?: string | null
          volume?: number | null
        }
        Relationships: []
      }
      nasdaq_stocks: {
        Row: {
          company_name: string
          created_at: string | null
          etf: boolean | null
          financial_status: string | null
          id: string
          last_updated: string | null
          market_category: string | null
          next_shares: boolean | null
          round_lot_size: number | null
          test_issue: boolean | null
          ticker: string
          updated_at: string | null
        }
        Insert: {
          company_name: string
          created_at?: string | null
          etf?: boolean | null
          financial_status?: string | null
          id?: string
          last_updated?: string | null
          market_category?: string | null
          next_shares?: boolean | null
          round_lot_size?: number | null
          test_issue?: boolean | null
          ticker: string
          updated_at?: string | null
        }
        Update: {
          company_name?: string
          created_at?: string | null
          etf?: boolean | null
          financial_status?: string | null
          id?: string
          last_updated?: string | null
          market_category?: string | null
          next_shares?: boolean | null
          round_lot_size?: number | null
          test_issue?: boolean | null
          ticker?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      nasdaq_sync_logs: {
        Row: {
          created_at: string | null
          end_time: string | null
          error_message: string | null
          id: string
          start_time: string | null
          status: string | null
          stocks_added: number | null
          stocks_removed: number | null
          stocks_updated: number | null
        }
        Insert: {
          created_at?: string | null
          end_time?: string | null
          error_message?: string | null
          id?: string
          start_time?: string | null
          status?: string | null
          stocks_added?: number | null
          stocks_removed?: number | null
          stocks_updated?: number | null
        }
        Update: {
          created_at?: string | null
          end_time?: string | null
          error_message?: string | null
          id?: string
          start_time?: string | null
          status?: string | null
          stocks_added?: number | null
          stocks_removed?: number | null
          stocks_updated?: number | null
        }
        Relationships: []
      }
      processing_state: {
        Row: {
          created_at: string | null
          last_processed_index: number
          last_updated: string | null
          process_name: string
          total_items: number | null
        }
        Insert: {
          created_at?: string | null
          last_processed_index?: number
          last_updated?: string | null
          process_name: string
          total_items?: number | null
        }
        Update: {
          created_at?: string | null
          last_processed_index?: number
          last_updated?: string | null
          process_name?: string
          total_items?: number | null
        }
        Relationships: []
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
      stock_exchanges: {
        Row: {
          closing_time: string
          code: string
          country: string
          created_at: string
          description: string | null
          exchange_type: string | null
          id: string
          is_active: boolean
          name: string
          opening_time: string
          timezone: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          closing_time: string
          code: string
          country: string
          created_at?: string
          description?: string | null
          exchange_type?: string | null
          id?: string
          is_active?: boolean
          name: string
          opening_time: string
          timezone: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          closing_time?: string
          code?: string
          country?: string
          created_at?: string
          description?: string | null
          exchange_type?: string | null
          id?: string
          is_active?: boolean
          name?: string
          opening_time?: string
          timezone?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      stock_historical_prices: {
        Row: {
          adjusted_close: number
          close_price: number
          created_at: string
          date: string
          high_price: number
          id: string
          low_price: number
          open_price: number
          stock_id: string
          updated_at: string
          volume: number
        }
        Insert: {
          adjusted_close: number
          close_price: number
          created_at?: string
          date: string
          high_price: number
          id?: string
          low_price: number
          open_price: number
          stock_id: string
          updated_at?: string
          volume: number
        }
        Update: {
          adjusted_close?: number
          close_price?: number
          created_at?: string
          date?: string
          high_price?: number
          id?: string
          low_price?: number
          open_price?: number
          stock_id?: string
          updated_at?: string
          volume?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_historical_prices_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "nasdaq_stocks"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_picks: {
        Row: {
          confidence_score: number | null
          created_at: string
          fundamental_score: number | null
          id: string
          is_active: boolean
          market_trend_score: number | null
          order_number: number | null
          pick_date: string
          potential_gain: number | null
          rationale: string | null
          sentiment_score: number | null
          stock_id: string
          technical_score: number | null
          ticker: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          fundamental_score?: number | null
          id?: string
          is_active?: boolean
          market_trend_score?: number | null
          order_number?: number | null
          pick_date?: string
          potential_gain?: number | null
          rationale?: string | null
          sentiment_score?: number | null
          stock_id: string
          technical_score?: number | null
          ticker: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          fundamental_score?: number | null
          id?: string
          is_active?: boolean
          market_trend_score?: number | null
          order_number?: number | null
          pick_date?: string
          potential_gain?: number | null
          rationale?: string | null
          sentiment_score?: number | null
          stock_id?: string
          technical_score?: number | null
          ticker?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_picks_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "nasdaq_stocks"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_price_history: {
        Row: {
          close: number
          created_at: string
          date: string
          high: number | null
          id: string
          low: number | null
          open: number | null
          ticker: string
          updated_at: string
          volume: number
        }
        Insert: {
          close: number
          created_at?: string
          date: string
          high?: number | null
          id?: string
          low?: number | null
          open?: number | null
          ticker: string
          updated_at?: string
          volume: number
        }
        Update: {
          close?: number
          created_at?: string
          date?: string
          high?: number | null
          id?: string
          low?: number | null
          open?: number | null
          ticker?: string
          updated_at?: string
          volume?: number
        }
        Relationships: []
      }
      stock_quote_update_logs: {
        Row: {
          batch_size: number
          completed_at: string | null
          created_at: string
          error_details: Json | null
          failed_updates: number
          id: string
          processed_count: number
          started_at: string
          successful_updates: number
          total_duration_ms: number | null
          updated_at: string
        }
        Insert: {
          batch_size: number
          completed_at?: string | null
          created_at?: string
          error_details?: Json | null
          failed_updates?: number
          id?: string
          processed_count?: number
          started_at?: string
          successful_updates?: number
          total_duration_ms?: number | null
          updated_at?: string
        }
        Update: {
          batch_size?: number
          completed_at?: string | null
          created_at?: string
          error_details?: Json | null
          failed_updates?: number
          id?: string
          processed_count?: number
          started_at?: string
          successful_updates?: number
          total_duration_ms?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      stock_quotes: {
        Row: {
          change_amount: number
          change_percent: number
          created_at: string
          high_price: number
          id: string
          low_price: number
          open_price: number
          previous_close: number
          price: number
          stock_id: string
          timestamp: string
          updated_at: string
          volume: number
        }
        Insert: {
          change_amount: number
          change_percent: number
          created_at?: string
          high_price: number
          id?: string
          low_price: number
          open_price: number
          previous_close: number
          price: number
          stock_id: string
          timestamp: string
          updated_at?: string
          volume: number
        }
        Update: {
          change_amount?: number
          change_percent?: number
          created_at?: string
          high_price?: number
          id?: string
          low_price?: number
          open_price?: number
          previous_close?: number
          price?: number
          stock_id?: string
          timestamp?: string
          updated_at?: string
          volume?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_quotes_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "nasdaq_stocks"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_trades: {
        Row: {
          close_date: string | null
          closing_price: number | null
          created_at: string
          fundamental_score: number | null
          id: string
          is_open: boolean
          overall_score: number | null
          performance_percentage: number | null
          price_at_selection: number
          selection_date: string
          selection_rationale: string | null
          sentiment_score: number | null
          stock_id: string
          technical_score: number | null
          updated_at: string
          volume_at_selection: number
        }
        Insert: {
          close_date?: string | null
          closing_price?: number | null
          created_at?: string
          fundamental_score?: number | null
          id?: string
          is_open?: boolean
          overall_score?: number | null
          performance_percentage?: number | null
          price_at_selection: number
          selection_date?: string
          selection_rationale?: string | null
          sentiment_score?: number | null
          stock_id: string
          technical_score?: number | null
          updated_at?: string
          volume_at_selection: number
        }
        Update: {
          close_date?: string | null
          closing_price?: number | null
          created_at?: string
          fundamental_score?: number | null
          id?: string
          is_open?: boolean
          overall_score?: number | null
          performance_percentage?: number | null
          price_at_selection?: number
          selection_date?: string
          selection_rationale?: string | null
          sentiment_score?: number | null
          stock_id?: string
          technical_score?: number | null
          updated_at?: string
          volume_at_selection?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_trades_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "nasdaq_stocks"
            referencedColumns: ["id"]
          },
        ]
      }
      technical_indicators: {
        Row: {
          created_at: string
          data: Json
          id: string
          indicator_type: string
          last_refreshed: string | null
          series_type: string | null
          stock_id: string
          ticker: string
          time_period: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data: Json
          id?: string
          indicator_type: string
          last_refreshed?: string | null
          series_type?: string | null
          stock_id: string
          ticker: string
          time_period?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          indicator_type?: string
          last_refreshed?: string | null
          series_type?: string | null
          stock_id?: string
          ticker?: string
          time_period?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "technical_indicators_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "nasdaq_stocks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
