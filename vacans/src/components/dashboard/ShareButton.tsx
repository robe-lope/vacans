'use client'

import { useState } from 'react'
import { Share2, Check } from 'lucide-react'

type Props = { url: string; nombreNegocio: string }

export default function ShareButton({ url, nombreNegocio }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({
        title: nombreNegocio,
        text: `Reservá tu turno con ${nombreNegocio}`,
        url,
      })
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-800 transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
      {copied ? 'Copiado' : 'Compartir link'}
    </button>
  )
}
