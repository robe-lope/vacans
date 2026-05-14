'use client'

import { useState, useTransition } from 'react'
import { updatePerfil } from '../actions'

type Profesional = {
  nombre_negocio: string
  descripcion: string | null
  telefono_wa: string
  slug: string
  email_contacto: string
} | null

const SLUG_RE = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/

export default function PerfilForm({ profesional }: { profesional: Profesional }) {
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const [slug, setSlug] = useState(profesional?.slug ?? '')
  const [slugError, setSlugError] = useState<string | null>(null)

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setSlug(val)
    if (val.length > 0 && val.length < 3) setSlugError('Mínimo 3 caracteres')
    else if (val.length >= 3 && !SLUG_RE.test(val)) setSlugError('No puede empezar ni terminar con guión')
    else setSlugError(null)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (slugError || slug.length < 3) return
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updatePerfil(formData)
      if (result.error) {
        setStatus('error')
        setMessage(result.error)
      } else {
        setStatus('success')
        setMessage('Cambios guardados.')
        setTimeout(() => setStatus('idle'), 3000)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-5">
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1.5">Nombre del negocio</label>
        <input
          name="nombre_negocio"
          required
          defaultValue={profesional?.nombre_negocio}
          placeholder="María Depilación"
          className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1.5">
          Descripción <span className="text-zinc-400 font-normal">(opcional, máx. 120 chars)</span>
        </label>
        <textarea
          name="descripcion"
          defaultValue={profesional?.descripcion ?? ''}
          maxLength={120}
          rows={2}
          placeholder="Depilación definitiva · Flores, CABA"
          className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1.5">Tu link de Vacans</label>
        <div className="flex items-center border border-zinc-200 rounded-xl overflow-hidden focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition">
          <span className="px-3 py-2.5 text-sm text-zinc-400 bg-zinc-50 border-r border-zinc-200 whitespace-nowrap">
            vacans.vercel.app/
          </span>
          <input
            name="slug"
            required
            value={slug}
            onChange={handleSlugChange}
            className="flex-1 px-3 py-2.5 text-sm outline-none bg-transparent"
          />
        </div>
        {slugError && <p className="text-xs text-red-500 mt-1">{slugError}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1.5">Teléfono WhatsApp</label>
        <div className="flex items-center border border-zinc-200 rounded-xl overflow-hidden focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition">
          <span className="px-3 py-2.5 text-sm text-zinc-400 bg-zinc-50 border-r border-zinc-200">+</span>
          <input
            name="telefono_wa"
            required
            defaultValue={profesional?.telefono_wa}
            placeholder="5491112345678"
            className="flex-1 px-3 py-2.5 text-sm outline-none bg-transparent"
          />
        </div>
        <p className="text-xs text-zinc-400 mt-1">Sin el +. Ej: 5491112345678</p>
      </div>

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
        disabled={isPending || !!slugError}
        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition"
      >
        {isPending ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </form>
  )
}
