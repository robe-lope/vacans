'use client'

import { useState, useTransition } from 'react'
import { Trash2, Plus } from 'lucide-react'
import { createTipoTurno, deleteTipoTurno } from '../actions'

type Tipo = {
  id: string
  nombre: string
  duracion_mins: number
  descripcion: string | null
  precio_display: string | null
  color: string | null
  activo: boolean
}

const DURACIONES = [10, 15, 20, 30, 45, 60, 90, 120]
const COLORES = [
  '#CC0000', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f59e0b', '#10b981', '#3b82f6', '#64748b',
]

export default function TiposClient({ tipos, plan }: { tipos: Tipo[]; plan: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [color, setColor] = useState(COLORES[0])
  const [showForm, setShowForm] = useState(false)

  const atLimit = plan === 'free' && tipos.length >= 2

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.set('color', color)
    startTransition(async () => {
      const result = await createTipoTurno(formData)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setShowForm(false)
        ;(e.target as HTMLFormElement).reset()
        setColor(COLORES[0])
        setTimeout(() => setSuccess(false), 3000)
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteTipoTurno(id)
    })
  }

  return (
    <div className="space-y-4">
      {/* Lista existente */}
      {tipos.length > 0 && (
        <div className="bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-100">
          {tipos.map(tipo => (
            <div key={tipo.id} className="flex items-center gap-3 px-4 py-3">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: tipo.color ?? '#CC0000' }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-800">{tipo.nombre}</p>
                <p className="text-xs text-zinc-400">
                  {tipo.duracion_mins} min
                  {tipo.precio_display ? ` · ${tipo.precio_display}` : ''}
                </p>
              </div>
              <button
                onClick={() => handleDelete(tipo.id)}
                disabled={isPending}
                className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 disabled:opacity-40"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {success && (
        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3.5 py-2.5">
          Tipo de turno creado correctamente.
        </p>
      )}

      {/* Upgrade banner */}
      {atLimit && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-sm text-red-700">
          <p className="font-medium">Límite del plan gratuito</p>
          <p className="mt-0.5 text-red-600 text-xs">
            Tenés 2 tipos activos. Contactanos para hacer upgrade a premium y agregar más.
          </p>
        </div>
      )}

      {/* Formulario nuevo tipo */}
      {!atLimit && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Agregar tipo de turno
        </button>
      )}

      {!atLimit && showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-zinc-800">Nuevo tipo de turno</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-zinc-600 mb-1">Nombre *</label>
              <input
                name="nombre"
                required
                placeholder="Depilación definitiva"
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">Duración *</label>
              <select
                name="duracion_mins"
                required
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition bg-white"
              >
                {DURACIONES.map(d => (
                  <option key={d} value={d}>{d} min</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">Precio (opcional)</label>
              <input
                name="precio_display"
                placeholder="$5.000"
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-zinc-600 mb-1">Descripción (opcional)</label>
              <input
                name="descripcion"
                placeholder="Breve descripción del servicio"
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-zinc-600 mb-2">Color del badge</label>
              <div className="flex gap-2 flex-wrap">
                {COLORES.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-offset-2 ring-zinc-400' : 'hover:scale-110'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-xl transition"
            >
              {isPending ? 'Guardando…' : 'Crear'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(null) }}
              className="text-sm text-zinc-500 hover:text-zinc-700 px-4 py-2 rounded-xl transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
