// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types pour la base de données
export interface Database {
  public: {
    Tables: {
      favorites: {
        Row: {
          id: number
          channel_id: string
          channel_name: string
          channel_group: string | null
          created_at: string
          vote_count: number
        }
        Insert: {
          id?: number
          channel_id: string
          channel_name: string
          channel_group?: string | null
          created_at?: string
          vote_count?: number
        }
        Update: {
          id?: number
          channel_id?: string
          channel_name?: string
          channel_group?: string | null
          created_at?: string
          vote_count?: number
        }
      }
    }
  }
}