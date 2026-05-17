'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type ActionResult = { error?: string; success?: boolean }

async function getProfesional() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const { data: profesional } = await supabase
    .from('profesionales')
    .select('id, plan')
    .eq('user_id', user.id)
    .single()

  if (!profesional) throw new Error('Perfil no encontrado')
  return { supabase, user, profesional }
}

// --- Perfil ---

export async function updatePerfil(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await getProfesional()

  const slug = (formData.get('slug') as string).toLowerCase().trim()

  const { data: existing } = await supabase
    .from('profesionales')
    .select('id')
    .eq('slug', slug)
    .neq('user_id', user.id)
    .maybeSingle()

  if (existing) return { error: 'Ese slug ya está en uso. Elegí otro.' }

  const fotoUrl = formData.get('foto_url') as string | null

  const { error } = await supabase
    .from('profesionales')
    .update({
      nombre_negocio: (formData.get('nombre_negocio') as string).trim(),
      descripcion:    (formData.get('descripcion') as string).trim() || null,
      telefono_wa:    (formData.get('telefono_wa') as string).trim(),
      slug,
      ...(fotoUrl ? { foto_url: fotoUrl } : {}),
    })
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/configuracion/perfil')
  revalidatePath('/dashboard')
  return { success: true }
}

// --- Tipos de turno ---

export async function createTipoTurno(formData: FormData): Promise<ActionResult> {
  const { supabase, profesional } = await getProfesional()

  if (profesional.plan === 'free') {
    const { count } = await supabase
      .from('tipos_turno')
      .select('id', { count: 'exact', head: true })
      .eq('profesional_id', profesional.id)
      .eq('activo', true)

    if ((count ?? 0) >= 2) {
      return { error: 'El plan gratuito permite máximo 2 tipos de turno activos.' }
    }
  }

  const { error } = await supabase.from('tipos_turno').insert({
    profesional_id: profesional.id,
    nombre:         (formData.get('nombre') as string).trim(),
    duracion_mins:  parseInt(formData.get('duracion_mins') as string, 10),
    descripcion:    (formData.get('descripcion') as string).trim() || null,
    precio_display: (formData.get('precio_display') as string).trim() || null,
    color:          (formData.get('color') as string) || '#CC0000',
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/configuracion/tipos')
  return { success: true }
}

export async function deleteTipoTurno(id: string): Promise<ActionResult> {
  const { supabase } = await getProfesional()

  const { error } = await supabase
    .from('tipos_turno')
    .update({ activo: false })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/configuracion/tipos')
  return { success: true }
}

// --- Apariencia ---

export async function updateApariencia(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await getProfesional()

  const color_primario = (formData.get('color_primario') as string).trim()
  const color_acento   = (formData.get('color_acento') as string).trim()

  const { error } = await supabase
    .from('profesionales')
    .update({ color_primario, color_acento })
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/configuracion/apariencia')
  revalidatePath('/dashboard')
  return { success: true }
}

// --- Disponibilidad ---

type DiaDisponibilidad = {
  dia_semana: number
  hora_inicio: string
  hora_fin: string
}

export async function upsertDisponibilidad(days: DiaDisponibilidad[]): Promise<ActionResult> {
  const { supabase, profesional } = await getProfesional()

  await supabase
    .from('disponibilidad')
    .delete()
    .eq('profesional_id', profesional.id)

  if (days.length > 0) {
    const { error } = await supabase.from('disponibilidad').insert(
      days.map(d => ({ ...d, profesional_id: profesional.id, activo: true }))
    )
    if (error) return { error: error.message }
  }

  revalidatePath('/dashboard/configuracion/disponibilidad')
  return { success: true }
}
