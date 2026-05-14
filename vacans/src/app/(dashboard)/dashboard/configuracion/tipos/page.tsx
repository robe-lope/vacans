import { createClient } from '@/lib/supabase/server'
import TiposClient from './TiposClient'

export default async function TiposPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profesional } = await supabase
    .from('profesionales')
    .select('id, plan')
    .eq('user_id', user!.id)
    .single()

  const { data: tipos } = profesional
    ? await supabase
        .from('tipos_turno')
        .select('id, nombre, duracion_mins, descripcion, precio_display, color, activo')
        .eq('profesional_id', profesional.id)
        .eq('activo', true)
        .order('orden', { ascending: true })
    : { data: [] }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Tipos de turno</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Los servicios que ofrecés. Plan gratuito: máximo 2.
        </p>
      </div>
      <TiposClient tipos={tipos ?? []} plan={profesional?.plan ?? 'free'} />
    </div>
  )
}
