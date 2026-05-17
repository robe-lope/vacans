'use client'

import { useRef, useState, useTransition } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { upsertPromo, deletePromo } from './actions'

type Props = {
  profesionalId: string
  activePromo: { id: string; imagen_url: string; caduca_en: string } | null
}

export default function PromoClient({ profesionalId, activePromo }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview,   setPreview]   = useState<string | null>(activePromo?.imagen_url ?? null)
  const [caduca,    setCaduca]    = useState(activePromo?.caduca_en ?? '')
  const [uploading, setUploading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [status,  setStatus]  = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setStatus('error'); setMessage('La imagen no puede superar 5 MB.')
      return
    }
    setUploading(true)
    const supabase = createClient()
    const path = `${profesionalId}/${Date.now()}`
    const { error } = await supabase.storage
      .from('promos')
      .upload(path, file, { upsert: false, contentType: file.type })
    if (error) {
      setStatus('error'); setMessage('Error al subir la imagen. Intentá de nuevo.')
    } else {
      const { data } = supabase.storage.from('promos').getPublicUrl(path)
      setPreview(data.publicUrl)
      setStatus('idle'); setMessage(null)
    }
    setUploading(false)
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!preview || !caduca) return
    startTransition(async () => {
      const result = await upsertPromo(profesionalId, preview, caduca)
      if (result.error) { setStatus('error'); setMessage(result.error) }
      else { setStatus('success'); setMessage('Promo guardada.'); setTimeout(() => setStatus('idle'), 3000) }
    })
  }

  function handleDelete() {
    if (!activePromo) return
    startTransition(async () => {
      const result = await deletePromo(activePromo.id)
      if (result.error) { setStatus('error'); setMessage(result.error) }
      else { setPreview(null); setCaduca(''); setStatus('idle') }
    })
  }

  const minDate = new Date().toISOString().slice(0, 10)

  return (
    <form onSubmit={handleSave} className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-5">

      {/* Preview / upload */}
      <div>
        {preview ? (
          <div className="relative rounded-xl overflow-hidden border border-zinc-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Preview promo" className="w-full object-cover max-h-64" />
            <button
              type="button"
              onClick={() => { setPreview(null); setCaduca('') }}
              className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-lg hover:bg-white transition"
              title="Quitar imagen"
            >
              <Trash2 className="w-4 h-4 text-zinc-500" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full flex flex-col items-center justify-center gap-2 py-10 rounded-xl border-2 border-dashed border-zinc-200 hover:border-zinc-300 text-zinc-400 hover:text-zinc-500 transition disabled:opacity-50"
          >
            {uploading
              ? <div className="w-5 h-5 border-2 border-zinc-300 border-t-transparent rounded-full animate-spin" />
              : <ImagePlus className="w-6 h-6" />}
            <span className="text-sm font-medium">{uploading ? 'Subiendo…' : 'Subir imagen'}</span>
            <span className="text-xs">JPG, PNG o WEBP · máx. 5 MB</span>
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Expiry date */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1.5">Válida hasta</label>
        <input
          type="date"
          required
          value={caduca}
          min={minDate}
          onChange={e => setCaduca(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition"
        />
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

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isPending || !preview || !caduca || uploading}
          className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition"
        >
          {isPending ? 'Guardando…' : 'Guardar promo'}
        </button>
        {activePromo && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="text-sm text-zinc-400 hover:text-red-500 transition disabled:opacity-50"
          >
            Eliminar promo activa
          </button>
        )}
      </div>
    </form>
  )
}
