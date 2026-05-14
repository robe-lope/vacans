import type { Disponibilidad, SlotOverride, TipoTurno } from '@/types'

export type SlotData = {
  fecha: string      // 'YYYY-MM-DD'
  horaInicio: string // 'HH:MM'
  tipoTurnoId: string
}

// Slots organizados por tipoId → fecha → ['HH:MM', ...]
export type SlotsByTipo = Record<string, Record<string, string[]>>

type Params = {
  tiposTurno: TipoTurno[]
  disponibilidad: Disponibilidad[]
  overrides: SlotOverride[]
  // solo las confirmadas (con tipo_turno_id)
  solicitudesConfirmadas: { fecha: string; hora_inicio: string; tipo_turno_id: string | null }[]
  fechaDesde: string  // 'YYYY-MM-DD'
  fechaHasta: string  // 'YYYY-MM-DD'
}

export function generarSlots(p: Params): SlotsByTipo {
  const { tiposTurno, disponibilidad, overrides, solicitudesConfirmadas } = p

  // Confirmadas como set para lookup O(1)
  const confirmadas = new Set(
    solicitudesConfirmadas
      .filter(s => s.tipo_turno_id !== null)
      .map(s => `${s.fecha}|${s.hora_inicio.slice(0, 5)}|${s.tipo_turno_id}`)
  )

  const result: SlotsByTipo = {}
  for (const tipo of tiposTurno) {
    if (!tipo.activo) continue
    result[tipo.id] = {}
  }

  // Iterar cada día del rango
  const current = new Date(p.fechaDesde + 'T00:00:00')
  const fin    = new Date(p.fechaHasta + 'T00:00:00')

  while (current <= fin) {
    const fechaStr   = current.toISOString().slice(0, 10)
    const diaSemana  = current.getUTCDay()

    const dayOverrides = overrides.filter(o => o.fecha === fechaStr)
    const quitarSet    = new Set(
      dayOverrides
        .filter(o => o.tipo === 'quitar')
        // clave: "HH:MM|tipoId" o "HH:MM|" si aplica a todos
        .map(o => `${o.hora_inicio.slice(0, 5)}|${o.tipo_turno_id ?? ''}`)
    )
    const agregarList = dayOverrides.filter(o => o.tipo === 'agregar')

    const dispDia = disponibilidad.find(d => d.dia_semana === diaSemana && d.activo)

    for (const tipo of tiposTurno) {
      if (!tipo.activo) continue
      if (!result[tipo.id][fechaStr]) result[tipo.id][fechaStr] = []

      // --- slots de disponibilidad regular ---
      if (dispDia) {
        const [hi, mi] = dispDia.hora_inicio.slice(0, 5).split(':').map(Number)
        const [hf, mf] = dispDia.hora_fin.slice(0, 5).split(':').map(Number)
        let cur = hi * 60 + mi
        const end = hf * 60 + mf

        while (cur + tipo.duracion_mins <= end) {
          const hora = `${String(Math.floor(cur / 60)).padStart(2, '0')}:${String(cur % 60).padStart(2, '0')}`
          const quitado = quitarSet.has(`${hora}|${tipo.id}`) || quitarSet.has(`${hora}|`)
          const confirmado = confirmadas.has(`${fechaStr}|${hora}|${tipo.id}`)

          if (!quitado && !confirmado) {
            result[tipo.id][fechaStr].push(hora)
          }
          cur += tipo.duracion_mins
        }
      }

      // --- agregar overrides ---
      for (const ov of agregarList) {
        // aplica si es para este tipo específico o para todos (null)
        if (ov.tipo_turno_id !== null && ov.tipo_turno_id !== tipo.id) continue
        const hora = ov.hora_inicio.slice(0, 5)
        const confirmado = confirmadas.has(`${fechaStr}|${hora}|${tipo.id}`)
        if (!confirmado && !result[tipo.id][fechaStr].includes(hora)) {
          result[tipo.id][fechaStr].push(hora)
        }
      }

      // Ordenar cronológicamente
      result[tipo.id][fechaStr].sort()
    }

    current.setUTCDate(current.getUTCDate() + 1)
  }

  return result
}

// Dado una fecha YYYY-MM-DD, devuelve el dia de semana (UTC) 0=Dom..6=Sáb
export function diaSemanaUTC(fecha: string): number {
  return new Date(fecha + 'T00:00:00Z').getUTCDay()
}
