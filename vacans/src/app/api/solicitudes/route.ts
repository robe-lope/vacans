import { createServiceClient } from '@/lib/supabase/server'
import { notificarProfesional } from '@/lib/whatsapp-meta'
import { NextResponse } from 'next/server'

const FULL_DAY   = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado']
const MONTH_NAMES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

function fechaHumana(fecha: string): string {
  const d = new Date(fecha + 'T00:00:00Z')
  return `${FULL_DAY[d.getUTCDay()]} ${d.getUTCDate()} de ${MONTH_NAMES[d.getUTCMonth()]}`
}

export async function POST(request: Request) {
  let body: { profesional_id?: string; tipo_turno_id?: string; fecha?: string; hora_inicio?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const { profesional_id, tipo_turno_id, fecha, hora_inicio } = body
  if (!profesional_id || !tipo_turno_id || !fecha || !hora_inicio) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const db = createServiceClient()

  const { data: solicitud, error } = await db
    .from('solicitudes')
    .insert({
      profesional_id,
      tipo_turno_id,
      fecha,
      hora_inicio,
      nombre_cliente: 'Anónimo',
      estado: 'pendiente',
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Notificar al profesional via WhatsApp Meta API (best-effort)
  const [profRes, tipoRes] = await Promise.all([
    db.from('profesionales').select('telefono_wa').eq('id', profesional_id).single(),
    db.from('tipos_turno').select('nombre, duracion_mins').eq('id', tipo_turno_id).single(),
  ])

  if (profRes.data && tipoRes.data) {
    notificarProfesional({
      telefonoProfesional: profRes.data.telefono_wa,
      nombreCliente: 'Anónimo',
      tipoTurno: `${tipoRes.data.nombre} (${tipoRes.data.duracion_mins} min)`,
      fecha: fechaHumana(fecha),
      hora: hora_inicio.slice(0, 5),
      solicitudId: solicitud.id,
    })
      .then(ok => {
        if (!ok) console.error('[WA] notificarProfesional devolvió false', { profesional_id, solicitudId: solicitud.id })
      })
      .catch(err => console.error('[WA] notificarProfesional excepción', err))
  }

  return NextResponse.json({ id: solicitud.id })
}
