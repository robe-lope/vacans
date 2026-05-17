'use client'

import { useRef, useState, useTransition } from 'react'
import { Camera } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { updatePerfil } from '../actions'

type Profesional = {
  nombre_negocio: string
  descripcion: string | null
  telefono_wa: string
  slug: string
  email_contacto: string
} | null

type Props = {
  profesional: Profesional
  userId: string
  fotoUrl: string | null
}

const SLUG_RE = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/

export default function PerfilForm({ profesional, userId, fotoUrl }: Props) {
  const [isPending, startTransition] = useTransition()
  const [status, setStatus]   = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const [slug, setSlug]       = useState(profesional?.slug ?? '')
  const [slugError, setSlugError] = useState<string | null>(null)
  const [foto, setFoto]       = useState<string | null>(fotoUrl)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const initial = (profesional?.nombre_negocio ?? '?').charAt(0).toUpperCase()

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setSlug(val)
    if (val.length > 0 && val.length < 3) setSlugError('Mínimo 3 caracteres')
    else if (val.length >= 3 && !SLUG_RE.test(val)) setSlugError('No puede empezar ni terminar con guión')
    else setSlugError(null)
  }

  async function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setStatus('error')
      setMessage('La imagen no puede superar 2 MB.')
      return
    }

    setUploading(true)
    const supabase = createClient()
    const path = `${userId}/avatar`

    const { error } = await supabase.storage
      .from('avatares')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (error) {
      setStatus('error')
      setMessage('Error al subir la imagen. Intentá de nuevo.')
    } else {
      const { data } = supabase.storage.from('avatares').getPublicUrl(path)
      setFoto(`${data.publicUrl}?t=${Date.now()}`)
      setStatus('idle')
      setMessage(null)
    }
    setUploading(false)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (slugError || slug.length < 3) return
    setStatus('idle')
    setMessage(null)
    const formData = new FormData(e.currentTarget)
    if (foto) formData.set('foto_url', foto.split('?')[0]) // store clean URL
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

      {/* Avatar upload */}
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="relative w-20 h-20 rounded-full overflow-hidden group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-300"
        >
          {foto ? (
            <img src={foto} alt="" className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-white text-2xl font-semibold"
              style={{ background: 'linear-gradient(135deg, #CC0000, #990000)' }}
            >
              {initial}
            </div>
          )}
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {uploading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Camera className="w-5 h-5 text-white" />
                <span className="text-[10px] text-white font-semibold uppercase tracking-wide">Cambiar</span>
              </>
            )}
          </div>
        </button>
        <p className="text-xs text-zinc-400">JPG, PNG o WEBP · máx. 2 MB</p>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFotoChange}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1.5">Nombre del negocio</label>
        <input
          name="nombre_negocio"
          required
          defaultValue={profesional?.nombre_negocio}
          placeholder="María Depilación"
          className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition"
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
          className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1.5">Tu link de Vacans</label>
        <div className="flex items-center border border-zinc-200 rounded-xl overflow-hidden focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-100 transition">
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
        <div className="flex items-center border border-zinc-200 rounded-xl overflow-hidden focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-100 transition">
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
        disabled={isPending || !!slugError || uploading}
        className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition"
      >
        {isPending ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </form>
  )
}
