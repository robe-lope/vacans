'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type Result = { error?: string }

export async function upsertPromo(
  profesionalId: string,
  imagenUrl: string,
  caducaEn: string
): Promise<Result> {
  const supabase = await createClient()

  await supabase.from('promos').delete().eq('profesional_id', profesionalId)

  const { error } = await supabase.from('promos').insert({
    profesional_id: profesionalId,
    imagen_url:     imagenUrl,
    caduca_en:      caducaEn,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/promo')
  return {}
}

export async function deletePromo(promoId: string): Promise<Result> {
  const supabase = await createClient()
  const { error } = await supabase.from('promos').delete().eq('id', promoId)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/promo')
  return {}
}
