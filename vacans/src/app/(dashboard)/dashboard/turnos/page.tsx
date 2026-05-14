import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { confirmarTurno, rechazarTurno } from './actions'

type EstadoFilter = 'pendiente' | 'confirmado' | 'rechazado' | 'all'

const ESTADO_LABEL: Record<string, string> = {
  pendiente:  'Pendiente',
  confirmado: 'Confirmado',
  rechazado:  'Rechazado',
}

const ESTADO_STYLE: Record<string, string> = {
  pendiente:  'bg-amber-50 text-amber-700 border-amber-100',
  confirmado: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  rechazado:  'bg-red-50 text-red-600 border-red-100',
}

const TABS: { label: string; value: EstadoFilter }[] = [
  { label: 'Todos',       value: 'all' },
  { label: 'Pendientes',  value: 'pendiente' },
  { label: 'Confirmados', value: 'confirmado' },
  { label: 'Rechazados',  value: 'rechazado' },
]

type SearchParams = Promise<{ estado?: string }>

export default async function TurnosPage({ searchParams }: { searchParams: SearchParams }) {
  const { estado: estadoParam } = await searchParams
  const estadoFilter = (estadoParam as EstadoFilter) ?? 'all'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profesional } = await supabase
    .from('profesionales')
    .select('id, slug')
    .eq('user_id', user!.id)
    .single()

  const query = supabase
    .from('solicitudes')
    .select('id, nombre_cliente, telefono_cliente, fecha, hora_inicio, estado, notas, tipo_turno_id')
    .eq('profesional_id', profesional!.id)
    .order('fecha', { ascending: true })
    .order('hora_inicio', { ascending: true })

  const { data: solicitudes } = estadoFilter !== 'all'
    ? await query.eq('estado', estadoFilter)
    : await query

  // Fetch tipo names to display
  const { data: tipos } = await supabase
    .from('tipos_turno')
    .select('id, nombre')
    .eq('profesional_id', profesional!.id)

  const tipoMap = new Map((tipos ?? []).map(t => [t.id, t.nombre]))

  const list = solicitudes ?? []

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Turnos</h1>
        <span className="text-sm text-zinc-400">{list.length} resultado{list.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-0.5">
        {TABS.map(tab => {
          const active = tab.value === estadoFilter
          return (
            <Link
              key={tab.value}
              href={tab.value === 'all' ? '/dashboard/turnos' : `/dashboard/turnos?estado=${tab.value}`}
              className={[
                'px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border transition-colors',
                active
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'text-zinc-500 border-zinc-200 hover:border-zinc-300 hover:text-zinc-700',
              ].join(' ')}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>

      {/* List */}
      {list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-10 text-center text-zinc-400 text-sm">
          No hay turnos en esta categoría.
        </div>
      ) : (
        <div className="space-y-2.5">
          {list.map(s => {
            const fecha = new Date(s.fecha + 'T00:00:00Z')
            const fechaLabel = fecha.toLocaleDateString('es-AR', {
              weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC',
            })
            const tipoNombre = s.tipo_turno_id ? tipoMap.get(s.tipo_turno_id) : null
            const isPendiente = s.estado === 'pendiente'

            return (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-zinc-200 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-900 text-sm truncate">{s.nombre_cliente}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {tipoNombre && <span className="text-zinc-500 font-medium">{tipoNombre} · </span>}
                      {fechaLabel} · {s.hora_inicio.slice(0, 5)}
                    </p>
                    {s.notas && (
                      <p className="text-xs text-zinc-400 mt-1 italic truncate">{s.notas}</p>
                    )}
                  </div>
                  <span className={`text-xs border px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${ESTADO_STYLE[s.estado]}`}>
                    {ESTADO_LABEL[s.estado]}
                  </span>
                </div>

                {isPendiente && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-100">
                    <form action={confirmarTurno.bind(null, s.id)} className="flex-1">
                      <button
                        type="submit"
                        className="w-full py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-medium hover:bg-emerald-100 transition-colors"
                      >
                        Confirmar ✅
                      </button>
                    </form>
                    <form action={rechazarTurno.bind(null, s.id)} className="flex-1">
                      <button
                        type="submit"
                        className="w-full py-2 rounded-xl bg-red-50 text-red-600 border border-red-100 text-sm font-medium hover:bg-red-100 transition-colors"
                      >
                        Rechazar ❌
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
