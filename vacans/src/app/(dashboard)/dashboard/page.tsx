import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generarSlots } from '@/lib/slots'
import ShareButton from '@/components/dashboard/ShareButton'
import ShareStoriesButton from '@/components/dashboard/ShareStoriesButton'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profesional } = await supabase
    .from('profesionales')
    .select('id, nombre_negocio, slug, color_primario, foto_url')
    .eq('user_id', user!.id)
    .single()

  const today = new Date().toISOString().split('T')[0]

  const hasta7 = (() => {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() + 6)
    return d.toISOString().slice(0, 10)
  })()

  const [
    { data: solicitudesHoy },
    { data: proximasConfirmadas },
    { data: tipos },
    { data: disp },
    { data: overrides },
    { data: confirmadasStories },
  ] = await Promise.all([
    profesional
      ? supabase.from('solicitudes').select('estado').eq('profesional_id', profesional.id).eq('fecha', today)
      : Promise.resolve({ data: [] }),
    profesional
      ? supabase.from('solicitudes').select('id, fecha, hora_inicio, nombre_cliente').eq('profesional_id', profesional.id).eq('estado', 'confirmado').gte('fecha', today).order('fecha').order('hora_inicio').limit(3)
      : Promise.resolve({ data: [] }),
    profesional
      ? supabase.from('tipos_turno').select('*').eq('profesional_id', profesional.id).eq('activo', true)
      : Promise.resolve({ data: [] }),
    profesional
      ? supabase.from('disponibilidad').select('*').eq('profesional_id', profesional.id)
      : Promise.resolve({ data: [] }),
    profesional
      ? supabase.from('slot_overrides').select('*').eq('profesional_id', profesional.id).gte('fecha', today).lte('fecha', hasta7)
      : Promise.resolve({ data: [] }),
    profesional
      ? createServiceClient().from('solicitudes').select('fecha, hora_inicio, tipo_turno_id').eq('profesional_id', profesional.id).eq('estado', 'confirmado').gte('fecha', today).lte('fecha', hasta7)
      : Promise.resolve({ data: [] }),
  ])

  const pendientes  = (solicitudesHoy ?? []).filter(s => s.estado === 'pendiente').length
  const confirmadas = (solicitudesHoy ?? []).filter(s => s.estado === 'confirmado').length
  const rechazadas  = (solicitudesHoy ?? []).filter(s => s.estado === 'rechazado').length

  const slotsByTipo = profesional
    ? generarSlots({
        tiposTurno: tipos ?? [],
        disponibilidad: disp ?? [],
        overrides: overrides ?? [],
        solicitudesConfirmadas: (confirmadasStories ?? []).map(s => ({
          fecha: s.fecha,
          hora_inicio: s.hora_inicio,
          tipo_turno_id: s.tipo_turno_id,
        })),
        fechaDesde: today,
        fechaHasta: hasta7,
      })
    : {}

  const slotsHoy: { hora: string; tipoNombre: string }[] = []
  for (const [tipoId, byFecha] of Object.entries(slotsByTipo)) {
    const tipoData = (tipos ?? []).find(t => t.id === tipoId)
    if (!tipoData) continue
    for (const hora of (byFecha[today] ?? [])) {
      slotsHoy.push({ hora, tipoNombre: tipoData.nombre })
    }
  }
  slotsHoy.sort((a, b) => a.hora.localeCompare(b.hora))

  const fechaHoy = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://vacans.vercel.app').replace(/\/$/, '')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">
          Bienvenido{profesional?.nombre_negocio ? `, ${profesional.nombre_negocio}` : ''}
        </h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Link público */}
      {profesional?.slug && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1">Tu página pública</p>
            <p className="text-sm text-zinc-700 font-medium truncate">{appUrl}/{profesional.slug}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <ShareButton
              url={`${appUrl}/${profesional.slug}`}
              nombreNegocio={profesional.nombre_negocio ?? ''}
            />
            <ShareStoriesButton
              profesional={{
                nombre_negocio: profesional.nombre_negocio ?? '',
                foto_url: profesional.foto_url ?? null,
                color_primario: profesional.color_primario ?? '#CC0000',
                slug: profesional.slug,
              }}
              slots={slotsHoy}
              fechaHoy={fechaHoy}
            />
            <a
              href={`/${profesional.slug}`}
              target="_blank"
              className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              Ver →
            </a>
          </div>
        </div>
      )}

      {/* Stats del día */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-3">Hoy</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Pendientes',  count: pendientes,  color: 'text-amber-600 bg-amber-50 border-amber-100' },
            { label: 'Confirmados', count: confirmadas, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
            { label: 'Rechazados',  count: rechazadas,  color: 'text-red-600 bg-red-50 border-red-100' },
          ].map(({ label, count, color }) => (
            <div key={label} className={`rounded-2xl border p-4 text-center ${color}`}>
              <p className="text-2xl font-semibold">{count}</p>
              <p className="text-xs font-medium mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Próximas confirmadas */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Próximos confirmados</h2>
          <Link href="/dashboard/turnos" className="text-xs text-red-600 hover:underline">Ver todos</Link>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-100">
          {(proximasConfirmadas ?? []).length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-8">No hay turnos confirmados próximos.</p>
          ) : (
            (proximasConfirmadas ?? []).map((s) => (
              <div key={s.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-800">{s.nombre_cliente}</p>
                  <p className="text-xs text-zinc-400">
                    {new Date(s.fecha + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                    {' · '}{s.hora_inicio.slice(0, 5)}
                  </p>
                </div>
                <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full font-medium">
                  Confirmado
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {!profesional && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-center">
          <p className="text-sm font-medium text-red-800 mb-2">Completá tu perfil para empezar</p>
          <Link href="/dashboard/configuracion/perfil" className="text-sm text-red-600 font-medium hover:underline">
            Ir a configuración →
          </Link>
        </div>
      )}
    </div>
  )
}
