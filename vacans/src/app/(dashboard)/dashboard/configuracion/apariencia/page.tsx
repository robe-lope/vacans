import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AparienciaClient from './AparienciaClient'

export default async function AparienciaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profesional } = await supabase
    .from('profesionales')
    .select('color_primario, color_acento, nombre_negocio')
    .eq('user_id', user.id)
    .single()

  return (
    <AparienciaClient
      initialPrimary={profesional?.color_primario ?? '#CC0000'}
      initialAccent={profesional?.color_acento   ?? '#FF3333'}
      nombreNegocio={profesional?.nombre_negocio ?? 'Mi Negocio'}
    />
  )
}
