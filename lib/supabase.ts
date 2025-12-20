import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return url.startsWith('http://') || url.startsWith('https://')
  } catch {
    return false
  }
}

const isSupabaseConfigured = isValidUrl(supabaseUrl) && supabaseAnonKey && supabaseAnonKey !== 'your_supabase_anon_key'

let supabaseInstance: SupabaseClient | null = null

if (isSupabaseConfigured) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.warn('Failed to initialize Supabase client:', error)
    supabaseInstance = null
  }
}

export const supabase = supabaseInstance

export const isConnected = () => supabase !== null

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          password: string
          profile_picture: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          password: string
          profile_picture?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          password?: string
          profile_picture?: string | null
          created_at?: string
        }
      }
      okrs: {
        Row: {
          id: string
          department: string
          goal: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          department: string
          goal: string
          status: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          department?: string
          goal?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      key_results: {
        Row: {
          id: string
          okr_id: string
          title: string
          start_date: string
          end_date: string
          target: number
          current: number
          unit: string
          target_type: string
          created_at: string
        }
        Insert: {
          id?: string
          okr_id: string
          title: string
          start_date: string
          end_date: string
          target: number
          current: number
          unit: string
          target_type?: string
          created_at?: string
        }
        Update: {
          id?: string
          okr_id?: string
          title?: string
          start_date?: string
          end_date?: string
          target?: number
          current?: number
          unit?: string
          target_type?: string
          created_at?: string
        }
      }
      milestone_stages: {
        Row: {
          id: string
          key_result_id: string
          name: string
          weight: number
          progress: number
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          key_result_id: string
          name: string
          weight: number
          progress?: number
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          key_result_id?: string
          name?: string
          weight?: number
          progress?: number
          order_index?: number
          created_at?: string
        }
      }
      progress_history: {
        Row: {
          id: string
          key_result_id: string
          date: string
          value: number
          created_at: string
        }
        Insert: {
          id?: string
          key_result_id: string
          date: string
          value: number
          created_at?: string
        }
        Update: {
          id?: string
          key_result_id?: string
          date?: string
          value?: number
          created_at?: string
        }
      }
      initiatives: {
        Row: {
          id: string
          okr_id: string
          title: string
          completed: boolean
          assignee: string | null
          created_at: string
        }
        Insert: {
          id?: string
          okr_id: string
          title: string
          completed?: boolean
          assignee?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          okr_id?: string
          title?: string
          completed?: boolean
          assignee?: string | null
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          initiative_id: string
          author: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          initiative_id: string
          author: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          initiative_id?: string
          author?: string
          content?: string
          created_at?: string
        }
      }
      check_ins: {
        Row: {
          id: string
          okr_id: string
          okr_goal: string
          user_id: string
          user_name: string
          department: string
          message: string
          created_at: string
        }
        Insert: {
          id?: string
          okr_id: string
          okr_goal: string
          user_id: string
          user_name: string
          department: string
          message: string
          created_at?: string
        }
        Update: {
          id?: string
          okr_id?: string
          okr_goal?: string
          user_id?: string
          user_name?: string
          department?: string
          message?: string
          created_at?: string
        }
      }
      check_in_key_result_updates: {
        Row: {
          id: string
          check_in_id: string
          key_result_id: string
          key_result_title: string
          previous_value: number
          new_value: number
          created_at: string
        }
        Insert: {
          id?: string
          check_in_id: string
          key_result_id: string
          key_result_title: string
          previous_value: number
          new_value: number
          created_at?: string
        }
        Update: {
          id?: string
          check_in_id?: string
          key_result_id?: string
          key_result_title?: string
          previous_value?: number
          new_value?: number
          created_at?: string
        }
      }
      company_info: {
        Row: {
          id: string
          mission: string
          vision: string
          core_values: string[]
          updated_at: string
        }
        Insert: {
          id?: string
          mission: string
          vision: string
          core_values: string[]
          updated_at?: string
        }
        Update: {
          id?: string
          mission?: string
          vision?: string
          core_values?: string[]
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          okr_id: string | null
          key_result_id: string | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          okr_id?: string | null
          key_result_id?: string | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          okr_id?: string | null
          key_result_id?: string | null
          read?: boolean
          created_at?: string
        }
      }
    }
  }
}
