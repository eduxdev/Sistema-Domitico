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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          device_id: string | null
          gas_level: string | null
          id: string
          is_resolved: boolean | null
          is_sent: boolean | null
          message: string | null
          notification_sent_at: string | null
          notification_type: string | null
          resolved_at: string | null
          sensor_value: number | null
          updated_at: string | null
          user_id: string | null
          warning_start_time: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          device_id?: string | null
          gas_level?: string | null
          id?: string
          is_resolved?: boolean | null
          is_sent?: boolean | null
          message?: string | null
          notification_sent_at?: string | null
          notification_type?: string | null
          resolved_at?: string | null
          sensor_value?: number | null
          updated_at?: string | null
          user_id?: string | null
          warning_start_time?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          device_id?: string | null
          gas_level?: string | null
          id?: string
          is_resolved?: boolean | null
          is_sent?: boolean | null
          message?: string | null
          notification_sent_at?: string | null
          notification_type?: string | null
          resolved_at?: string | null
          sensor_value?: number | null
          updated_at?: string | null
          user_id?: string | null
          warning_start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          created_at: string | null
          device_id: string
          device_name: string
          device_type: string | null
          id: string
          ip_address: string | null
          is_active: boolean | null
          last_seen: string | null
          mac_address: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          device_id: string
          device_name: string
          device_type?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_seen?: string | null
          mac_address?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          device_id?: string
          device_name?: string
          device_type?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_seen?: string | null
          mac_address?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sensor_readings: {
        Row: {
          buzzer_activated: boolean
          created_at: string
          device_id: string | null
          gas_level: string
          id: number
          sensor_value: number
          timestamp: string
          user_id: string | null
        }
        Insert: {
          buzzer_activated?: boolean
          created_at?: string
          device_id?: string | null
          gas_level: string
          id?: number
          sensor_value: number
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          buzzer_activated?: boolean
          created_at?: string
          device_id?: string | null
          gas_level?: string
          id?: number
          sensor_value?: number
          timestamp?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sensor_readings_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sensor_readings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_devices: {
        Row: {
          added_at: string | null
          device_id: string | null
          id: string
          is_primary_owner: boolean | null
          location: string | null
          nickname: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          added_at?: string | null
          device_id?: string | null
          id?: string
          is_primary_owner?: boolean | null
          location?: string | null
          nickname?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          added_at?: string | null
          device_id?: string | null
          id?: string
          is_primary_owner?: boolean | null
          location?: string | null
          nickname?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_devices_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          password_hash: string
          phone_number: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          password_hash: string
          phone_number?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          password_hash?: string
          phone_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_alerts: { Args: never; Returns: number }
      get_available_devices_for_user: {
        Args: { user_uuid: string }
        Returns: {
          device_id: string
          device_name: string
          device_type: string
          ip_address: string
          is_claimed: boolean
          last_seen: string
          mac_address: string
        }[]
      }
      get_latest_sensor_reading: {
        Args: { device_uuid: string }
        Returns: {
          buzzer_activated: boolean
          device_name: string
          gas_level: string
          reading_timestamp: string
          sensor_value: number
        }[]
      }
      resolve_alerts_for_device: {
        Args: { device_uuid: string }
        Returns: number
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

// Tipos de conveniencia para usar en la aplicación
export type SensorReading = Database['public']['Tables']['sensor_readings']['Row']
export type User = Database['public']['Tables']['users']['Row']
export type Device = Database['public']['Tables']['devices']['Row']
export type UserDevice = Database['public']['Tables']['user_devices']['Row']
export type Alert = Database['public']['Tables']['alerts']['Row']

// Tipos para inserciones
export type SensorReadingInsert = Database['public']['Tables']['sensor_readings']['Insert']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type DeviceInsert = Database['public']['Tables']['devices']['Insert']
export type UserDeviceInsert = Database['public']['Tables']['user_devices']['Insert']
export type AlertInsert = Database['public']['Tables']['alerts']['Insert']
