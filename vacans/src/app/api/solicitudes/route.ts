import { createServiceClient } from '@/lib/supabase/server'
import { notificarProfesional, enviarMensajeTexto } from '@/lib/whatsapp-meta'
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
    const telefono  = profRes.data.telefono_wa
    const tipoNombre = `${tipoRes.data.nombre} (${tipoRes.data.duracion_mins} min)`
    const fechaStr  = fechaHumana(fecha)
    const horaStr   = hora_inicio.slice(0, 5)

    // Template para apertura de sesión (cold outbound)
    notificarProfesional({
      telefonoProfesional: telefono,
      nombreCliente: 'Anónimo',
      tipoTurno: tipoNombre,
      fecha: fechaStr,
      hora: horaStr,
      solicitudId: solicitud.id,
    }).catch(e => console.error('[WA] template error:', e))

    // Texto con info completa + instrucciones para confirmar/rechazar
    const mensaje = `📅 *Nueva solicitud de turno*\n\n👤 Anónimo\n🗂 ${tipoNombre}\n📆 ${fechaStr} a las ${horaStr}\n\nRespondé *1* para confirmar o *2* para rechazar.`
    enviarMensajeTexto(telefono, mensaje)
      .catch(e => console.error('[WA] text notification error:', e))
  }

  return NextResponse.json({ id: solicitud.id })
}
