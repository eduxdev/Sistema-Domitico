export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      sensor_readings: {
        Row: {
          buzzer_activated: boolean
          created_at: string
          gas_level: string
          id: number
          sensor_value: number
          timestamp: string
        }
        Insert: {
          buzzer_activated?: boolean
          created_at?: string
          gas_level: string
          id?: number
          sensor_value: number
          timestamp?: string
        }
        Update: {
          buzzer_activated?: boolean
          created_at?: string
          gas_level?: string
          id?: number
          sensor_value?: number
          timestamp?: string
        }
        Relationships: []
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

export type SensorReading = Database['public']['Tables']['sensor_readings']['Row']
