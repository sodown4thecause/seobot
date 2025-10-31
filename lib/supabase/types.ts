export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      business_profiles: {
        Row: {
          id: string
          user_id: string
          website_url: string
          industry: string | null
          locations: Json | null
          goals: Json | null
          content_frequency: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          website_url: string
          industry?: string | null
          locations?: Json | null
          goals?: Json | null
          content_frequency?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          website_url?: string
          industry?: string | null
          locations?: Json | null
          goals?: Json | null
          content_frequency?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      brand_voices: {
        Row: {
          id: string
          user_id: string
          tone: string
          style: string
          personality: Json | null
          sample_phrases: string[] | null
          embedding: number[] | null
          source: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tone: string
          style: string
          personality?: Json | null
          sample_phrases?: string[] | null
          embedding?: number[] | null
          source: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tone?: string
          style?: string
          personality?: Json | null
          sample_phrases?: string[] | null
          embedding?: number[] | null
          source?: string
          created_at?: string
        }
      }
      competitors: {
        Row: {
          id: string
          user_id: string
          domain: string
          domain_authority: number | null
          monthly_traffic: number | null
          priority: string
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          domain: string
          domain_authority?: number | null
          monthly_traffic?: number | null
          priority?: string
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          domain?: string
          domain_authority?: number | null
          monthly_traffic?: number | null
          priority?: string
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      keywords: {
        Row: {
          id: string
          user_id: string
          keyword: string
          search_volume: number | null
          keyword_difficulty: number | null
          current_ranking: number | null
          intent: string | null
          priority: string
          metadata: Json | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          keyword: string
          search_volume?: number | null
          keyword_difficulty?: number | null
          current_ranking?: number | null
          intent?: string | null
          priority?: string
          metadata?: Json | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          keyword?: string
          search_volume?: number | null
          keyword_difficulty?: number | null
          current_ranking?: number | null
          intent?: string | null
          priority?: string
          metadata?: Json | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      content: {
        Row: {
          id: string
          user_id: string
          title: string
          slug: string
          content_type: string
          target_keyword: string | null
          word_count: number | null
          seo_score: number | null
          status: string
          published_url: string | null
          published_at: string | null
          cms_id: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          slug: string
          content_type: string
          target_keyword?: string | null
          word_count?: number | null
          seo_score?: number | null
          status?: string
          published_url?: string | null
          published_at?: string | null
          cms_id?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          slug?: string
          content_type?: string
          target_keyword?: string | null
          word_count?: number | null
          seo_score?: number | null
          status?: string
          published_url?: string | null
          published_at?: string | null
          cms_id?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          user_id: string
          role: string
          content: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: string
          content: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: string
          content?: string
          metadata?: Json | null
          created_at?: string
        }
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
  }
}
