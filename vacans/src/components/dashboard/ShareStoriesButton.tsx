'use client'

import { useRef, useState, useEffect } from 'react'
import { ImageDown, Copy, Check, X } from 'lucide-react'
import TurnosStories from './TurnosStories'

type SlotHoy = {
  hora: string
  tipoNombre: string
}

type Props = {
  profesional: {
    nombre_negocio: string
    foto_url: string | null
    color_primario: string
    slug: string
  }
  slots: SlotHoy[]
  fechaHoy: string
}

export default function ShareStoriesButton({ profesional, slots, fechaHoy }: Props) {
  const ref                         = useRef<HTMLDivElement>(null)
  const timerRef                    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [loading, setLoading]       = useState(false)
  const [showBanner, setShowBanner] = useState(false)
  const [copied, setCopied]         = useState(false)

  const publicUrl = `vacans.vercel.app/${profesional.slug}`

  function dismissBanner() {
    setShowBanner(false)
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  async function handleShare() {
    if (!ref.current) return
    setLoading(true)
    let success = false
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(ref.current, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#fafafa',
      })

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png')
      })

      const file = new File([blob], 'mis-turnos-vacans.png', { type: 'image/png' })

      if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] })
      } else {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = 'mis-turnos-vacans.png'
        a.click()
        setTimeout(() => URL.revokeObjectURL(a.href), 1000)
      }
      success = true
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') console.error(err)
    } finally {
      setLoading(false)
    }

    if (success) {
      setShowBanner(true)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(dismissBanner, 6000)
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`https://${publicUrl}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard not available
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        onClick={handleShare}
        disabled={loading}
        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-800 transition-colors disabled:opacity-50"
      >
        <ImageDown className="w-3.5 h-3.5" />
        {loading ? 'Generando…' : 'Compartir turnos'}
      </button>

      {showBanner && (
        <div className="flex items-start gap-2 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-xs max-w-xs">
          <span className="shrink-0 mt-px">📎</span>
          <div className="flex-1 min-w-0">
            <p className="text-zinc-700 font-medium leading-snug">Acordate de agregar tu link al estado</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-zinc-500 truncate">{publicUrl}</span>
              <button
                onClick={handleCopy}
                className="shrink-0 p-0.5 rounded text-zinc-400 hover:text-zinc-600 transition-colors"
                aria-label="Copiar link"
              >
                {copied
                  ? <Check className="w-3.5 h-3.5 text-emerald-500" />
                  : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <button
            onClick={dismissBanner}
            className="shrink-0 p-0.5 rounded text-zinc-300 hover:text-zinc-500 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Render target — off-screen, captured by html2canvas */}
      <div
        ref={ref}
        style={{ position: 'fixed', left: '-9999px', top: 0, pointerEvents: 'none' }}
        aria-hidden
      >
        <TurnosStories profesional={profesional} slots={slots} fechaHoy={fechaHoy} />
      </div>
    </div>
  )
}
