'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

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
  const supabase  = await createClient()
  const profId    = await getProfesionalId()
  if (!profId) return { error: 'No autorizado' }

  const { error } = await supabase
    .from('solicitudes')
    .update({ estado })
    .eq('id', id)
    .eq('profesional_id', profId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/turnos')
  revalidatePath('/dashboard')
  return {}
}
