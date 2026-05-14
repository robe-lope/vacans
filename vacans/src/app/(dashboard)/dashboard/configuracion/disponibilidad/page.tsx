import { createClient } from '@/lib/supabase/server'
import DisponibilidadForm from './DisponibilidadForm'

export default async function DisponibilidadPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profesional } = await supabase
    .from('profesionales')
    .select('id')
    .eq('user_id', user!.id)
    .single()

  const [{ data: disponibilidad }, { data: tipos }] = await Promise.all([
    profesional
      ? supabase
          .from('disponibilidad')
          .select('dia_semana, hora_inicio, hora_fin')
          .eq('profesional_id', profesional.id)
          .eq('activo', true)
      : { data: [] },
    profesional
      ? supabase
          .from('tipos_turno')
          .select('nombre, duracion_mins')
          .eq('profesional_id', profesional.id)
          .eq('activo', true)
      : { data: [] },
  ])

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Horarios disponibles</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Definí los días y horarios en que aceptás turnos.
        </p>
      </div>
      <DisponibilidadForm
        initialDias={disponibilidad ?? []}
        tipos={tipos ?? []}
      />
    </div>
  )
}
