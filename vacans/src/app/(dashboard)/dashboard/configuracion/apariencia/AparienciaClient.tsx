'use client'

import { useState, useTransition } from 'react'
import { updateApariencia } from '../actions'

const PRESETS = [
  { label: 'Violeta Spa',     primary: '#7c3aed', accent: '#f0abfc' },
  { label: 'Verde Natura',    primary: '#16a34a', accent: '#bbf7d0' },
  { label: 'Azul Clínica',    primary: '#2563eb', accent: '#93c5fd' },
  { label: 'Rosa Estética',   primary: '#db2777', accent: '#fbcfe8' },
  { label: 'Negro Minimal',   primary: '#171717', accent: '#a3a3a3' },
  { label: 'Naranja Energía', primary: '#ea580c', accent: '#fed7aa' },
]

function computeVars(hex: string): React.CSSProperties {
  const h = hex.startsWith('#') ? hex.slice(1) : hex
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const blend  = (ratio: number) => `rgb(${Math.round(r+(255-r)*ratio)},${Math.round(g+(255-g)*ratio)},${Math.round(b+(255-b)*ratio)})`
  const darken = (ratio: number) => `rgb(${Math.round(r*ratio)},${Math.round(g*ratio)},${Math.round(b*ratio)})`
  return {
    '--primary':      hex,
    '--primary-light': blend(0.6),
    '--primary-dark':  darken(0.7),
    '--primary-bg':    blend(0.95),
    '--primary-10':    `rgba(${r},${g},${b},0.1)`,
  } as React.CSSProperties
}

type Props = {
  initialPrimary: string
  initialAccent:  string
  nombreNegocio:  string
}

export default function AparienciaClient({ initialPrimary, initialAccent, nombreNegocio }: Props) {
  const [primary, setPrimary] = useState(initialPrimary)
  const [accent,  setAccent]  = useState(initialAccent)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function selectPreset(p: typeof PRESETS[0]) {
    setPrimary(p.primary)
    setAccent(p.accent)
    setSaved(false)
  }

  function handleSave() {
    setError(null)
    setSaved(false)
    const fd = new FormData()
    fd.set('color_primario', primary)
    fd.set('color_acento', accent)
    startTransition(async () => {
      const res = await updateApariencia(fd)
      if (res?.error) setError(res.error)
      else setSaved(true)
    })
  }

  const colorVars = computeVars(primary)
  const initial   = nombreNegocio.charAt(0).toUpperCase()

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Apariencia</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Personalizá los colores de tu página pública.</p>
      </div>

      {/* Preset grid */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Paletas sugeridas</p>
        <div className="grid grid-cols-3 gap-3">
          {PRESETS.map(p => {
            const active = p.primary === primary
            return (
              <button
                key={p.primary}
                onClick={() => selectPreset(p)}
                className={[
                  'relative rounded-xl border-2 p-3 text-left transition-all',
                  active
                    ? 'border-zinc-900 shadow-sm'
                    : 'border-zinc-100 hover:border-zinc-300',
                ].join(' ')}
              >
                <div className="flex gap-1.5 mb-2">
                  <span
                    className="w-5 h-5 rounded-full"
                    style={{ background: p.primary }}
                  />
                  <span
                    className="w-5 h-5 rounded-full border border-zinc-100"
                    style={{ background: p.accent }}
                  />
                </div>
                <p className="text-[11px] font-medium text-zinc-600 leading-tight">{p.label}</p>
                {active && (
                  <span className="absolute top-2 right-2 text-zinc-900 text-xs font-bold">✓</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Custom hex inputs */}
        <div className="pt-1 border-t border-zinc-100">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-3">Color personalizado</p>
          <div className="flex gap-3">
            <label className="flex-1">
              <span className="text-xs text-zinc-500 mb-1 block">Primario</span>
              <div className="flex items-center gap-2 border border-zinc-200 rounded-lg px-3 py-2">
                <input
                  type="color"
                  value={primary}
                  onChange={e => { setPrimary(e.target.value); setSaved(false) }}
                  className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                />
                <input
                  type="text"
                  value={primary}
                  onChange={e => {
                    if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) {
                      setPrimary(e.target.value)
                      setSaved(false)
                    }
                  }}
                  className="flex-1 text-sm font-mono text-zinc-700 outline-none bg-transparent"
                  maxLength={7}
                />
              </div>
            </label>
            <label className="flex-1">
              <span className="text-xs text-zinc-500 mb-1 block">Acento</span>
              <div className="flex items-center gap-2 border border-zinc-200 rounded-lg px-3 py-2">
                <input
                  type="color"
                  value={accent}
                  onChange={e => { setAccent(e.target.value); setSaved(false) }}
                  className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                />
                <input
                  type="text"
                  value={accent}
                  onChange={e => {
                    if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) {
                      setAccent(e.target.value)
                      setSaved(false)
                    }
                  }}
                  className="flex-1 text-sm font-mono text-zinc-700 outline-none bg-transparent"
                  maxLength={7}
                />
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Live preview */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-4">Preview</p>
        <div
          className="rounded-xl overflow-hidden border border-zinc-200 shadow-sm"
          style={{ ...colorVars, fontFamily: 'var(--font-sans, system-ui)' }}
        >
          {/* Mini header */}
          <div
            className="px-3 pt-3 pb-0"
            style={{ background: 'white', borderBottom: '1px solid #e4e4e7' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ background: `linear-gradient(135deg, var(--primary), var(--primary-dark))` }}
              >
                {initial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-900 truncate">{nombreNegocio}</p>
                <p className="text-[11px] text-zinc-400">Tu página pública</p>
              </div>
              <span
                className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                style={{ color: 'var(--primary)', background: 'var(--primary-10)' }}
              >
                vacans
              </span>
            </div>
            {/* Mini tipo tab */}
            <div className="flex gap-1.5 pb-2.5">
              <span
                className="text-[11px] font-medium px-3 py-1 rounded-full"
                style={{ background: 'var(--primary)', color: 'white' }}
              >
                Tipo 1 · 30 min
              </span>
              <span
                className="text-[11px] font-medium px-3 py-1 rounded-full border"
                style={{ color: '#71717a', borderColor: '#e4e4e7' }}
              >
                Tipo 2 · 60 min
              </span>
            </div>
          </div>
          {/* Mini slots */}
          <div
            className="p-3"
            style={{ background: 'var(--primary-bg)' }}
          >
            <div className="grid grid-cols-3 gap-1.5">
              {['9:00', '9:30', '10:00', '10:30', '11:00', '11:30'].map(t => (
                <div
                  key={t}
                  className="rounded-lg text-center py-2.5 text-sm font-semibold"
                  style={{
                    background: 'white',
                    border: '1px solid #e4e4e7',
                    color: '#18181b',
                    fontFamily: 'var(--font-serif, Georgia)',
                  }}
                >
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Save */}
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2">{error}</p>}
      {saved && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2">✅ Cambios guardados</p>}

      <button
        onClick={handleSave}
        disabled={pending}
        className="w-full py-3 rounded-xl bg-zinc-900 text-white font-medium text-sm hover:bg-zinc-700 disabled:opacity-50 transition-colors"
      >
        {pending ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </div>
  )
}
