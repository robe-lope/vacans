import { createServiceClient } from '@/lib/supabase/server'
import { enviarMensajeTexto } from '@/lib/whatsapp-meta'

const CONFIRMAR_RE = /\b(1|si|sí|confirmar|ok|dale|yes)\b/i
const RECHAZAR_RE  = /\b(2|no|rechazar|cancelar)\b/i

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode      = searchParams.get('hub.mode')
  const token     = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WA_WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 })
  }
  return new Response('Forbidden', { status: 403 })
}

export async function POST(request: Request) {
  const body = await request.json()

  const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
  if (!message) return new Response('OK', { status: 200 })

  const from = message.from as string
  const text = (message.text?.body as string | undefined)?.trim() ?? ''

  const supabase = createServiceClient()

  // Identificar profesional por teléfono
  const { data: profesional } = await supabase
    .from('profesionales')
    .select('id, nombre_negocio, slug')
    .eq('telefono_wa', from)
    .eq('activo', true)
    .single()

  if (!profesional) return new Response('OK', { status: 200 })

  // Traer solicitudes pendientes (más reciente primero)
  const { data: pendientes } = await supabase
    .from('solicitudes')
    .select('id, nombre_cliente, telefono_cliente, fecha, hora_inicio')
    .eq('profesional_id', profesional.id)
    .eq('estado', 'pendiente')
    .order('created_at', { ascending: false })

  if (!pendientes || pendientes.length === 0) {
    await enviarMensajeTexto(from, 'No tenés turnos pendientes por confirmar. 👍')
    return new Response('OK', { status: 200 })
  }

  const esConfirmar = CONFIRMAR_RE.test(text)
  const esRechazar  = RECHAZAR_RE.test(text)

  // Texto no reconocido → listar pendientes
  if (!esConfirmar && !esRechazar) {
    const lista = pendientes
      .slice(0, 5)
      .map((s, i) => {
        const fecha = new Date(s.fecha + 'T00:00:00Z').toLocaleDateString('es-AR', {
          weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC',
        })
        return `${i + 1}. ${s.nombre_cliente} — ${fecha} ${s.hora_inicio.slice(0, 5)}`
      })
      .join('\n')
    await enviarMensajeTexto(
      from,
      `Tenés ${pendientes.length} turno${pendientes.length > 1 ? 's' : ''} pendiente${pendientes.length > 1 ? 's' : ''}:\n\n${lista}\n\nRespondé *1* para confirmar o *2* para rechazar el más reciente.`
    )
    return new Response('OK', { status: 200 })
  }

  // Actuar sobre el más reciente
  const solicitud   = pendientes[0]
  const nuevoEstado = esConfirmar ? 'confirmado' : 'rechazado'

  await supabase
    .from('solicitudes')
    .update({ estado: nuevoEstado })
    .eq('id', solicitud.id)

  const fechaLabel = new Date(solicitud.fecha + 'T00:00:00Z').toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
  })
  const hora = solicitud.hora_inicio.slice(0, 5)

  if (esConfirmar) {
    await enviarMensajeTexto(
      from,
      `✅ Turno de *${solicitud.nombre_cliente}* confirmado.\n📅 ${fechaLabel} a las ${hora}`
    )
    if (solicitud.telefono_cliente) {
      await enviarMensajeTexto(
        solicitud.telefono_cliente,
        `✅ ¡Tu turno fue confirmado!\n\n📅 ${fechaLabel} a las ${hora}\ncon *${profesional.nombre_negocio}*\n\nTe esperamos 👋`
      )
    }
  } else {
    await enviarMensajeTexto(from, `❌ Turno de *${solicitud.nombre_cliente}* rechazado.`)
    if (solicitud.telefono_cliente) {
      await enviarMensajeTexto(
        solicitud.telefono_cliente,
        `❌ Lo sentimos, ese turno no está disponible.\n\nPodés ver otros horarios en:\nvacans.vercel.app/${profesional.slug}`
      )
    }
  }

  return new Response('OK', { status: 200 })
}
