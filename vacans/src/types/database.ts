export type Database = {
  public: {
    Tables: {
      profesionales: {
        Row: {
          id: string
          user_id: string | null
          slug: string
          nombre_negocio: string
          descripcion: string | null
          telefono_wa: string
          email_contacto: string
          foto_url: string | null
          color_primario: string
          color_acento: string
          timezone: string
          plan: 'free' | 'premium'
          activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          slug: string
          nombre_negocio: string
          descripcion?: string | null
          telefono_wa: string
          email_contacto: string
          foto_url?: string | null
          color_primario?: string
          color_acento?: string
          timezone?: string
          plan?: 'free' | 'premium'
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['profesionales']['Insert']>
        Relationships: []
      }
      tipos_turno: {
        Row: {
          id: string
          profesional_id: string
          nombre: string
          duracion_mins: number
          descripcion: string | null
          precio_display: string | null
          color: string | null
          activo: boolean
          orden: number
          created_at: string
        }
        Insert: {
          id?: string
          profesional_id: string
          nombre: string
          duracion_mins: number
          descripcion?: string | null
          precio_display?: string | null
          color?: string | null
          activo?: boolean
          orden?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['tipos_turno']['Insert']>
        Relationships: []
      }
      disponibilidad: {
        Row: {
          id: string
          profesional_id: string
          dia_semana: number
          hora_inicio: string
          hora_fin: string
          activo: boolean
        }
        Insert: {
          id?: string
          profesional_id: string
          dia_semana: number
          hora_inicio: string
          hora_fin: string
          activo?: boolean
        }
        Update: Partial<Database['public']['Tables']['disponibilidad']['Insert']>
        Relationships: []
      }
      slot_overrides: {
        Row: {
          id: string
          profesional_id: string
          fecha: string
          hora_inicio: string
          tipo_turno_id: string | null
          tipo: 'agregar' | 'quitar'
          motivo: string | null
          created_at: string
        }
        Insert: {
          id?: string
          profesional_id: string
          fecha: string
          hora_inicio: string
          tipo_turno_id?: string | null
          tipo: 'agregar' | 'quitar'
          motivo?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['slot_overrides']['Insert']>
        Relationships: []
      }
      solicitudes: {
        Row: {
          id: string
          profesional_id: string
          tipo_turno_id: string | null
          fecha: string
          hora_inicio: string
          nombre_cliente: string
          telefono_cliente: string | null
          email_cliente: string | null
          estado: 'pendiente' | 'confirmado' | 'rechazado'
          notas: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profesional_id: string
          tipo_turno_id?: string | null
          fecha: string
          hora_inicio: string
          nombre_cliente: string
          telefono_cliente?: string | null
          email_cliente?: string | null
          estado?: 'pendiente' | 'confirmado' | 'rechazado'
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['solicitudes']['Insert']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
