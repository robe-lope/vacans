'use client'

import { useRef, useState } from 'react'
import { ImageDown } from 'lucide-react'
import TurnosStories from './TurnosStories'

type DiaResumen = {
  fecha: string
  diaNombre: string
  count: number
}

type Props = {
  profesional: {
    nombre_negocio: string
    foto_url: string | null
    color_primario: string
    slug: string
  }
  slotsResumen: DiaResumen[]
}

export default function ShareStoriesButton({ profesional, slotsResumen }: Props) {
  const ref     = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)

  async function handleShare() {
    if (!ref.current) return
    setLoading(true)
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
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={handleShare}
        disabled={loading}
        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-800 transition-colors disabled:opacity-50"
      >
        <ImageDown className="w-3.5 h-3.5" />
        {loading ? 'Generando…' : 'Compartir turnos'}
      </button>

      {/* Render target — off-screen, invisible, captured by html2canvas */}
      <div
        ref={ref}
        style={{ position: 'fixed', left: '-9999px', top: 0, visibility: 'hidden', pointerEvents: 'none' }}
        aria-hidden
      >
        <TurnosStories profesional={profesional} slotsResumen={slotsResumen} />
      </div>
    </>
  )
}
