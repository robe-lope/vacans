'use client'

import { useState, useTransition } from 'react'
import { upsertDisponibilidad } from '../actions'

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

type DiaState = {
  dia_semana: number
  activo: boolean
  hora_inicio: string
  hora_fin: string
}

type Props = {
  initialDias: { dia_semana: number; hora_inicio: string; hora_fin: string }[]
  tipos: { nombre: string; duracion_mins: number }[]
}

function calcSlots(inicio: string, fin: string, duracion: number): number {
  const [hi, mi] = inicio.split(':').map(Number)
  const [hf, mf] = fin.split(':').map(Number)
  const totalMins = (hf * 60 + mf) - (hi * 60 + mi)
  return totalMins > 0 ? Math.floor(totalMins / duracion) : 0
}

export default function DisponibilidadForm({ initialDias, tipos }: Props) {
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  const [dias, setDias] = useState<DiaState[]>(() =>
    Array.from({ length: 7 }, (_, i) => {
      const existing = initialDias.find(d => d.dia_semana === i)
      return {
        dia_semana: i,
        activo: !!existing,
        hora_inicio: existing?.hora_inicio.slice(0, 5) ?? '09:00',
        hora_fin: existing?.hora_fin.slice(0, 5) ?? '18:00',
      }
    })
  )

  function updateDia(idx: number, patch: Partial<DiaState>) {
    setDias(prev => prev.map((d, i) => i === idx ? { ...d, ...patch } : d))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const activeDias = dias
      .filter(d => d.activo)
      .map(({ dia_semana, hora_inicio, hora_fin }) => ({ dia_semana, hora_inicio, hora_fin }))

    startTransition(async () => {
      const result = await upsertDisponibilidad(activeDias)
      if (result?.error) {
        setStatus('error')
        setMessage(result.error)
      } else {
        setStatus('success')
        setMessage('Horarios guardados.')
        setTimeout(() => setStatus('idle'), 3000)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-100">
        {dias.map((dia, idx) => (
          <div key={dia.dia_semana} className="px-4 py-3">
            <div className="flex items-center gap-3">
              {/* Toggle */}
              <button
                type="button"
                onClick={() => updateDia(idx, { activo: !dia.activo })}
                className={`w-10 h-5 rounded-full transition-colors flex-shrink-0 relative ${
                  dia.activo ? 'bg-indigo-600' : 'bg-zinc-200'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    dia.activo ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
              <span className={`text-sm font-medium w-20 ${dia.activo ? 'text-zinc-800' : 'text-zinc-400'}`}>
                {DIAS[dia.dia_semana]}
              </span>

              {/* Horas */}
              {dia.activo && (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    value={dia.hora_inicio}
                    onChange={e => updateDia(idx, { hora_inicio: e.target.value })}
                    className="px-2 py-1 rounded-lg border border-zinc-200 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition"
                  />
                  <span className="text-zinc-400 text-sm">–</span>
                  <input
                    type="time"
                    value={dia.hora_fin}
                    onChange={e => updateDia(idx, { hora_fin: e.target.value })}
                    className="px-2 py-1 rounded-lg border border-zinc-200 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition"
                  />
                </div>
              )}
            </div>

            {/* Preview de slots */}
            {dia.activo && tipos.length > 0 && (
              <div className="mt-2 ml-[52px] flex flex-wrap gap-2">
                {tipos.map(tipo => {
                  const slots = calcSlots(dia.hora_inicio, dia.hora_fin, tipo.duracion_mins)
                  return (
                    <span key={tipo.nombre} className="text-xs text-zinc-400">
                      {tipo.nombre}: <strong className="text-zinc-600">{slots} slot{slots !== 1 ? 's' : ''}</strong>
                    </span>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Resumen */}
      {tipos.length === 0 && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3.5 py-2.5">
          Primero configurá al menos un tipo de turno para ver cuántos slots generás por día.
        </p>
      )}

      {status !== 'idle' && (
        <p className={`text-sm rounded-xl px-3.5 py-2.5 ${
          status === 'success'
            ? 'text-emerald-700 bg-emerald-50 border border-emerald-100'
            : 'text-red-600 bg-red-50 border border-red-100'
        }`}>
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition"
      >
        {isPending ? 'Guardando…' : 'Guardar horarios'}
      </button>
    </form>
  )
}
