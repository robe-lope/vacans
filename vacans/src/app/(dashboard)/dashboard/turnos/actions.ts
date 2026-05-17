'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { enviarMensajeTexto } from '@/lib/whatsapp-meta'

type Result = { error?: string }

async function getProfesionalId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profesionales')
    .select('id')
    .eq('user_id', user.id)
    .single()

  return data?.id ?? null
}

export async function confirmarTurno(id: string): Promise<void> {
  await updateEstado(id, 'confirmado')
}

export async function rechazarTurno(id: string): Promise<void> {
  await updateEstado(id, 'rechazado')
}

async function updateEstado(
  id: string,
  estado: 'confirmado' | 'rechazado'
): Promise<Result> {
  const supabase = await createClient()
  const profId   = await getProfesionalId()
  if (!profId) return { error: 'No autorizado' }

  const { data: solicitud } = await supabase
    .from('solicitudes')
    .select('nombre_cliente, telefono_cliente, fecha, hora_inicio')
    .eq('id', id)
    .eq('profesional_id', profId)
    .single()

  const { error } = await supabase
    .from('solicitudes')
    .update({ estado })
    .eq('id', id)
    .eq('profesional_id', profId)

  if (error) return { error: error.message }

  // Notificar al cliente por WA (best-effort)
  if (solicitud?.telefono_cliente) {
    const { data: prof } = await supabase
      .from('profesionales')
      .select('nombre_negocio, slug')
      .eq('id', profId)
      .single()

    const fechaLabel = new Date(solicitud.fecha + 'T00:00:00Z').toLocaleDateString('es-AR', {
      weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
    })
    const hora = solicitud.hora_inicio.slice(0, 5)

    if (estado === 'confirmado') {
      enviarMensajeTexto(
        solicitud.telefono_cliente,
        `✅ ¡Tu turno fue confirmado!\n\n📅 ${fechaLabel} a las ${hora}\ncon *${prof?.nombre_negocio ?? ''}*\n\nTe esperamos 👋`
      ).catch(() => {})
    } else {
      enviarMensajeTexto(
        solicitud.telefono_cliente,
        `❌ Lo sentimos, ese turno no está disponible.\n\nPodés ver otros horarios en:\nvacans.vercel.app/${prof?.slug ?? ''}`
      ).catch(() => {})
    }
  }

  revalidatePath('/dashboard/turnos')
  revalidatePath('/dashboard')
  return {}
}
