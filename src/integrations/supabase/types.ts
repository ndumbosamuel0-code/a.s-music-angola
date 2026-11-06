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
          id?: number
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
      [_ in never]: never
    }
    Functions: {
      can_read_cover: { Args: { _path: string }; Returns: boolean }
      can_stream: { Args: { _path: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "artist" | "user"
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
      app_role: ["admin", "artist", "user"],
      payment_status: ["pendente", "pago"],
      track_status: ["pending", "approved", "rejected", "removed"],
      verification_status: ["pending", "verified", "rejected"],
    },
  },
} as const
