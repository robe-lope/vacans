import type { Database } from './database'

export type { Database }

export type Profesional    = Database['public']['Tables']['profesionales']['Row']
export type TipoTurno      = Database['public']['Tables']['tipos_turno']['Row']
export type Disponibilidad = Database['public']['Tables']['disponibilidad']['Row']
export type SlotOverride   = Database['public']['Tables']['slot_overrides']['Row']
export type Solicitud      = Database['public']['Tables']['solicitudes']['Row']

// Tipo computado para la grilla pública
export type Slot = {
  fecha: string        // 'YYYY-MM-DD'
  horaInicio: string   // 'HH:MM'
  tipoTurno: TipoTurno
}
