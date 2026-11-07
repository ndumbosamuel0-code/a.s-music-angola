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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      artist_earnings_ledger: {
        Row: {
          amount_kz: number
          artist_user_id: string
          created_at: string
          created_by: string | null
          id: string
          reference: string | null
          source: string
        }
        Insert: {
          amount_kz: number
          artist_user_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          reference?: string | null
          source: string
        }
        Update: {
          amount_kz?: number
          artist_user_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          reference?: string | null
          source?: string
        }
        Relationships: []
      }
      artist_payment_accounts: {
        Row: {
          account_holder: string
          account_number: string | null
          bank_name: string
          iban: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_holder: string
          account_number?: string | null
          bank_name: string
          iban?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_holder?: string
          account_number?: string | null
          bank_name?: string
          iban?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      artist_payout_requests: {
        Row: {
          account_snapshot: Json
          amount_kz: number
          artist_user_id: string
          id: string
          paid_at: string | null
          payment_reference: string | null
          requested_at: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          account_snapshot: Json
          amount_kz: number
          artist_user_id: string
          id?: string
          paid_at?: string | null
          payment_reference?: string | null
          requested_at?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          account_snapshot?: Json
          amount_kz?: number
          artist_user_id?: string
          id?: string
          paid_at?: string | null
          payment_reference?: string | null
          requested_at?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: []
      }
      artist_premium_subscriptions: {
        Row: {
          created_at: string
          ends_at: string
          id: string
          payment_order_id: string
          starts_at: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          id?: string
          payment_order_id: string
          starts_at: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: string
          payment_order_id?: string
          starts_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "artist_premium_subscriptions_payment_order_id_fkey"
            columns: ["payment_order_id"]
            isOneToOne: true
            referencedRelation: "billing_payment_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      artists: {
        Row: {
          bio: string | null
          created_at: string
          featured: boolean
          id: string
          image_url: string | null
          is_demo: boolean
          name: string
          owner_id: string | null
          province: string | null
          slug: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          featured?: boolean
          id?: string
          image_url?: string | null
          is_demo?: boolean
          name: string
          owner_id?: string | null
          province?: string | null
          slug: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          featured?: boolean
          id?: string
          image_url?: string | null
          is_demo?: boolean
          name?: string
          owner_id?: string | null
          province?: string | null
          slug?: string
        }
        Relationships: []
      }
      billing_catalog: {
        Row: {
          amount: number | null
          created_at: string
          currency: string
          description: string | null
          id: string
          is_active: boolean
          item_code: string
          item_type: string
          title: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          item_code: string
          item_type: string
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          item_code?: string
          item_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      billing_payment_orders: {
        Row: {
          amount: number
          catalog_item_id: string
          checkout_url: string | null
          created_at: string
          currency: string
          expires_at: string | null
          id: string
          item_code: string
          item_type: string
          metadata: Json
          paid_at: string | null
          payment_method: string | null
          provider: string
          provider_order_id: string | null
          provider_reference: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          catalog_item_id: string
          checkout_url?: string | null
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          item_code: string
          item_type: string
          metadata?: Json
          paid_at?: string | null
          payment_method?: string | null
          provider?: string
          provider_order_id?: string | null
          provider_reference?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          catalog_item_id?: string
          checkout_url?: string | null
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          item_code?: string
          item_type?: string
          metadata?: Json
          paid_at?: string | null
          payment_method?: string | null
          provider?: string
          provider_order_id?: string | null
          provider_reference?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_payment_orders_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "billing_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_support_messages: {
        Row: {
          attachment_path: string | null
          body: string | null
          created_at: string
          id: string
          message_type: string
          sender_id: string
          thread_id: string
        }
        Insert: {
          attachment_path?: string | null
          body?: string | null
          created_at?: string
          id?: string
          message_type?: string
          sender_id: string
          thread_id: string
        }
        Update: {
          attachment_path?: string | null
          body?: string | null
          created_at?: string
          id?: string
          message_type?: string
          sender_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_support_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "billing_support_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_support_threads: {
        Row: {
          created_at: string
          id: string
          payment_order_id: string | null
          payment_status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          payment_order_id?: string | null
          payment_status?: string
          subject?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payment_order_id?: string | null
          payment_status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_support_threads_payment_order_id_fkey"
            columns: ["payment_order_id"]
            isOneToOne: false
            referencedRelation: "billing_payment_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_webhook_events: {
        Row: {
          event_type: string
          id: string
          payload_digest: string | null
          processed_at: string | null
          processing_status: string
          provider: string
          provider_event_id: string
          received_at: string
        }
        Insert: {
          event_type: string
          id?: string
          payload_digest?: string | null
          processed_at?: string | null
          processing_status?: string
          provider: string
          provider_event_id: string
          received_at?: string
        }
        Update: {
          event_type?: string
          id?: string
          payload_digest?: string | null
          processed_at?: string | null
          processing_status?: string
          provider?: string
          provider_event_id?: string
          received_at?: string
        }
        Relationships: []
      }
      distributor_applications: {
        Row: {
          catalog_description: string
          company_name: string
          contact_email: string
          contact_name: string
          created_at: string
          id: string
          phone: string
          province: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
          website: string | null
        }
        Insert: {
          catalog_description: string
          company_name: string
          contact_email: string
          contact_name: string
          created_at?: string
          id?: string
          phone: string
          province?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
          website?: string | null
        }
        Update: {
          catalog_description?: string
          company_name?: string
          contact_email?: string
          contact_name?: string
          created_at?: string
          id?: string
          phone?: string
          province?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      financial_reports: {
        Row: {
          artist_id: string | null
          created_at: string
          distributor_commission_pct: number
          gross: number
          id: string
          is_demo: boolean
          payment_status: Database["public"]["Enums"]["payment_status"]
          period: string
          track_id: string | null
        }
        Insert: {
          artist_id?: string | null
          created_at?: string
          distributor_commission_pct?: number
          gross?: number
          id?: string
          is_demo?: boolean
          payment_status?: Database["public"]["Enums"]["payment_status"]
          period: string
          track_id?: string | null
        }
        Update: {
          artist_id?: string | null
          created_at?: string
          distributor_commission_pct?: number
          gross?: number
          id?: string
          is_demo?: boolean
          payment_status?: Database["public"]["Enums"]["payment_status"]
          period?: string
          track_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_reports_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_reports_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      genres: {
        Row: {
          id: string
          name: string
          slug: string
          sort: number
        }
        Insert: {
          id?: string
          name: string
          slug: string
          sort?: number
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          sort?: number
        }
        Relationships: []
      }
      licenses: {
        Row: {
          allows_download: boolean
          allows_streaming: boolean
          created_at: string
          ends_at: string | null
          evidence_path: string | null
          holder: string
          id: string
          notes: string | null
          starts_at: string | null
          territory: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          allows_download?: boolean
          allows_streaming?: boolean
          created_at?: string
          ends_at?: string | null
          evidence_path?: string | null
          holder: string
          id?: string
          notes?: string | null
          starts_at?: string | null
          territory?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          allows_download?: boolean
          allows_streaming?: boolean
          created_at?: string
          ends_at?: string | null
          evidence_path?: string | null
          holder?: string
          id?: string
          notes?: string | null
          starts_at?: string | null
          territory?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: []
      }
      platform_control: {
        Row: {
          id: boolean
          principal_admin_id: string | null
          updated_at: string
        }
        Insert: {
          id?: boolean
          principal_admin_id?: string | null
          updated_at?: string
        }
        Update: {
          id?: boolean
          principal_admin_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      platform_payment_methods: {
        Row: {
          display_name: string
          id: string
          instructions: Json
          is_enabled: boolean
          method_code: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          display_name: string
          id?: string
          instructions?: Json
          is_enabled?: boolean
          method_code: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          display_name?: string
          id?: string
          instructions?: Json
          is_enabled?: boolean
          method_code?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      platform_revenue_ledger: {
        Row: {
          amount: number
          confirmed_at: string | null
          created_at: string
          currency: string
          event_occurred_at: string
          external_event_id: string
          id: string
          metadata: Json
          paid_at: string | null
          provider: string
          source: string
          status: string
        }
        Insert: {
          amount: number
          confirmed_at?: string | null
          created_at?: string
          currency: string
          event_occurred_at?: string
          external_event_id: string
          id?: string
          metadata?: Json
          paid_at?: string | null
          provider: string
          source: string
          status?: string
        }
        Update: {
          amount?: number
          confirmed_at?: string | null
          created_at?: string
          currency?: string
          event_occurred_at?: string
          external_event_id?: string
          id?: string
          metadata?: Json
          paid_at?: string | null
          provider?: string
          source?: string
          status?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          artist_name: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          province: string | null
          role: string
          updated_at: string
        }
        Insert: {
          artist_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          province?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          artist_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          province?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          distribution_status: string
          distributor_commission: number
          id: number
          logo_url: string | null
          platform_share: number
          updated_at: string
        }
        Insert: {
          distribution_status?: string
          distributor_commission?: number
          id: number
          logo_url?: string | null
          platform_share?: number
          updated_at?: string
        }
        Update: {
          distribution_status?: string
          distributor_commission?: number
          id?: number
          logo_url?: string | null
          platform_share?: number
          updated_at?: string
        }
        Relationships: []
      }
      tracks: {
        Row: {
          admin_notes: string | null
          artist_id: string | null
          artist_name: string
          audio_path: string | null
          consent_download: boolean
          consent_promo: boolean
          consent_streaming: boolean
          cover_url: string | null
          created_at: string
          credits: string | null
          description: string | null
          download_allowed: boolean
          featured: boolean
          genre_id: string | null
          id: string
          is_demo: boolean
          license_id: string | null
          release_date: string | null
          rights_confirmed: boolean
          rights_holders: string | null
          status: Database["public"]["Enums"]["track_status"]
          submitted_by: string | null
          title: string
        }
        Insert: {
          admin_notes?: string | null
          artist_id?: string | null
          artist_name: string
          audio_path?: string | null
          consent_download?: boolean
          consent_promo?: boolean
          consent_streaming?: boolean
          cover_url?: string | null
          created_at?: string
          credits?: string | null
          description?: string | null
          download_allowed?: boolean
          featured?: boolean
          genre_id?: string | null
          id?: string
          is_demo?: boolean
          license_id?: string | null
          release_date?: string | null
          rights_confirmed?: boolean
          rights_holders?: string | null
          status?: Database["public"]["Enums"]["track_status"]
          submitted_by?: string | null
          title: string
        }
        Update: {
          admin_notes?: string | null
          artist_id?: string | null
          artist_name?: string
          audio_path?: string | null
          consent_download?: boolean
          consent_promo?: boolean
          consent_streaming?: boolean
          cover_url?: string | null
          created_at?: string
          credits?: string | null
          description?: string | null
          download_allowed?: boolean
          featured?: boolean
          genre_id?: string | null
          id?: string
          is_demo?: boolean
          license_id?: string | null
          release_date?: string | null
          rights_confirmed?: boolean
          rights_holders?: string | null
          status?: Database["public"]["Enums"]["track_status"]
          submitted_by?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracks_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracks_genre_id_fkey"
            columns: ["genre_id"]
            isOneToOne: false
            referencedRelation: "genres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracks_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
        ]
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
      platform_revenue_summary: {
        Row: {
          currency: string | null
          event_count: number | null
          source: string | null
          status: string | null
          total_amount: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      claim_principal_admin: { Args: never; Returns: undefined }
      confirm_manual_premium_payment: {
        Args: { p_payment_order_id: string }
        Returns: undefined
      }
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
      mark_artist_payout_paid: {
        Args: { p_reference: string; p_request_id: string }
        Returns: undefined
      }
      release_premium_access: {
        Args: { p_payment_order_id: string }
        Returns: {
          ends_at: string
          starts_at: string
          subscription_id: string
        }[]
      }
      request_artist_payout: { Args: never; Returns: string }
      review_artist_payout: {
        Args: { p_decision: string; p_note?: string; p_request_id: string }
        Returns: undefined
      }
      review_distributor_application: {
        Args: { p_application_id: string; p_decision: string; p_note?: string }
        Returns: undefined
      }
      save_artist_payment_account: {
        Args: {
          p_account_holder: string
          p_account_number?: string
          p_bank_name: string
          p_iban?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "artist" | "user" | "distributor"
      payment_status: "pendente" | "pago"
      track_status: "pending" | "approved" | "rejected" | "removed"
      verification_status: "pending" | "verified" | "rejected"
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
  public: {
    Enums: {
      app_role: ["admin", "artist", "user", "distributor"],
      payment_status: ["pendente", "pago"],
      track_status: ["pending", "approved", "rejected", "removed"],
      verification_status: ["pending", "verified", "rejected"],
    },
  },
} as const
