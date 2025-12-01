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
      dispositivos: {
        Row: {
          claimed_at: string | null
          claimed_by: string | null
          created_at: string | null
          device_id: string
          estado: string | null
          id: string
          ip_address: unknown
          is_claimed: boolean | null
          mac_address: string | null
          nombre: string
          tipo: string | null
          ubicacion: string | null
          updated_at: string | null
        }
        Insert: {
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string | null
          device_id: string
          estado?: string | null
          id?: string
          ip_address?: unknown
          is_claimed?: boolean | null
          mac_address?: string | null
          nombre: string
          tipo?: string | null
          ubicacion?: string | null
          updated_at?: string | null
        }
        Update: {
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string | null
          device_id?: string
          estado?: string | null
          id?: string
          ip_address?: unknown
          is_claimed?: boolean | null
          mac_address?: string | null
          nombre?: string
          tipo?: string | null
          ubicacion?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dispositivos_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      lecturas_gas: {
        Row: {
          created_at: string | null
          device_id: string | null
          estado: string
          id: number
          sensor_nombre: string | null
          valor_ppm: number
        }
        Insert: {
          created_at?: string | null
          device_id?: string | null
          estado: string
          id?: number
          sensor_nombre?: string | null
          valor_ppm: number
        }
        Update: {
          created_at?: string | null
          device_id?: string | null
          estado?: string
          id?: number
          sensor_nombre?: string | null
          valor_ppm?: number
        }
        Relationships: [
          {
            foreignKeyName: "lecturas_gas_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "dispositivos"
            referencedColumns: ["device_id"]
          },
        ]
      }
      lecturas_peligro: {
        Row: {
          created_at: string | null
          estado: string
          fecha_hora: string | null
          id: string
          notas: string | null
          sensor_nombre: string
          ubicacion: string | null
          valor_ppm: number
        }
        Insert: {
          created_at?: string | null
          estado: string
          fecha_hora?: string | null
          id?: string
          notas?: string | null
          sensor_nombre: string
          ubicacion?: string | null
          valor_ppm: number
        }
        Update: {
          created_at?: string | null
          estado?: string
          fecha_hora?: string | null
          id?: string
          notas?: string | null
          sensor_nombre?: string
          ubicacion?: string | null
          valor_ppm?: number
        }
        Relationships: []
      }
      notificaciones_enviadas: {
        Row: {
          asunto: string | null
          created_at: string | null
          destinatario: string
          error_mensaje: string | null
          estado: string
          id: string
          lectura_id: number | null
          mensaje: string
          nivel_alerta: string | null
          respuesta_api: string | null
          tipo: string
          valor_ppm: number | null
        }
        Insert: {
          asunto?: string | null
          created_at?: string | null
          destinatario: string
          error_mensaje?: string | null
          estado: string
          id?: string
          lectura_id?: number | null
          mensaje: string
          nivel_alerta?: string | null
          respuesta_api?: string | null
          tipo: string
          valor_ppm?: number | null
        }
        Update: {
          asunto?: string | null
          created_at?: string | null
          destinatario?: string
          error_mensaje?: string | null
          estado?: string
          id?: string
          lectura_id?: number | null
          mensaje?: string
          nivel_alerta?: string | null
          respuesta_api?: string | null
          tipo?: string
          valor_ppm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "notificaciones_enviadas_lectura_id_fkey"
            columns: ["lectura_id"]
            isOneToOne: false
            referencedRelation: "lecturas_gas"
            referencedColumns: ["id"]
          },
        ]
      }
      reportes_generados: {
        Row: {
          created_at: string | null
          fecha_fin: string | null
          fecha_inicio: string | null
          formato: string | null
          generado_por: string | null
          id: string
          nombre_archivo: string
          tipo_reporte: string
          total_alertas: number | null
          total_lecturas: number | null
        }
        Insert: {
          created_at?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          formato?: string | null
          generado_por?: string | null
          id?: string
          nombre_archivo: string
          tipo_reporte: string
          total_alertas?: number | null
          total_lecturas?: number | null
        }
        Update: {
          created_at?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          formato?: string | null
          generado_por?: string | null
          id?: string
          nombre_archivo?: string
          tipo_reporte?: string
          total_alertas?: number | null
          total_lecturas?: number | null
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          apellidos: string
          created_at: string | null
          email: string
          id: string
          nombre: string
          password_hash: string
          telefono: string | null
          updated_at: string | null
        }
        Insert: {
          apellidos: string
          created_at?: string | null
          email: string
          id?: string
          nombre: string
          password_hash: string
          telefono?: string | null
          updated_at?: string | null
        }
        Update: {
          apellidos?: string
          created_at?: string | null
          email?: string
          id?: string
          nombre?: string
          password_hash?: string
          telefono?: string | null
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