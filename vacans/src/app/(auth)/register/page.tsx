'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { register } from '../actions'

const SLUG_RE = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/

export default function RegisterPage() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [emailPendiente, setEmailPendiente] = useState(false)
  const [slug, setSlug] = useState('')
  const [slugError, setSlugError] = useState<string | null>(null)

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setSlug(val)
    if (val.length > 0 && val.length < 3) {
      setSlugError('Mínimo 3 caracteres')
    } else if (val.length >= 3 && !SLUG_RE.test(val)) {
      setSlugError('No puede empezar ni terminar con guión')
    } else {
      setSlugError(null)
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (slugError || slug.length < 3) return
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await register(formData)
      if (result?.error) setError(result.error)
      if (result?.emailPendiente) setEmailPendiente(true)
    })
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <span className="text-2xl font-bold tracking-tight text-zinc-900">vacans</span>
        <p className="text-sm text-zinc-500 mt-1">Creá tu página de turnos</p>
      </div>

      {emailPendiente ? (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 text-center space-y-3">
          <div className="text-3xl">📧</div>
          <p className="font-medium text-zinc-800">Revisá tu email</p>
          <p className="text-sm text-zinc-500">
            Te enviamos un link de confirmación. Una vez que lo confirmes podés ingresar.
          </p>
          <a href="/login" className="block text-sm text-red-600 font-medium hover:underline mt-2">
            Ir al login
          </a>
        </div>
      ) : (
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Nombre del negocio
            </label>
            <input
              name="nombre_negocio"
              type="text"
              required
              placeholder="María Depilación"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Tu link de Vacans
            </label>
            <div className="flex items-center border border-zinc-200 rounded-xl overflow-hidden focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-100 transition">
              <span className="px-3 py-2.5 text-sm text-zinc-400 bg-zinc-50 border-r border-zinc-200 whitespace-nowrap">
                vacans.xyz/
              </span>
              <input
                name="slug"
                type="text"
                required
                value={slug}
                onChange={handleSlugChange}
                placeholder="maria-depilacion"
                className="flex-1 px-3 py-2.5 text-sm outline-none bg-transparent"
              />
            </div>
            {slugError && (
              <p className="text-xs text-red-500 mt-1">{slugError}</p>
            )}
            {!slugError && slug.length >= 3 && (
              <p className="text-xs text-emerald-600 mt-1">vacans.xyz/{slug}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Teléfono WhatsApp
            </label>
            <div className="flex items-center border border-zinc-200 rounded-xl overflow-hidden focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-100 transition">
              <span className="px-3 py-2.5 text-sm text-zinc-400 bg-zinc-50 border-r border-zinc-200">
                +
              </span>
              <input
                name="telefono_wa"
                type="tel"
                required
                placeholder="5491112345678"
                className="flex-1 px-3 py-2.5 text-sm outline-none bg-transparent"
              />
            </div>
            <p className="text-xs text-zinc-400 mt-1">Sin el +. Ej: 5491112345678</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Email</label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="tu@email.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Contraseña</label>
            <input
              name="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending || !!slugError || slug.length < 3}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-medium text-sm rounded-xl py-2.5 transition"
          >
            {isPending ? 'Creando cuenta…' : 'Crear mi página'}
          </button>
        </form>
      </div>
      )}

      <p className="text-center text-sm text-zinc-500 mt-5">
        ¿Ya tenés cuenta?{' '}
        <Link href="/login" className="text-red-600 font-medium hover:underline">
          Ingresar
        </Link>
      </p>
    </div>
  )
}
