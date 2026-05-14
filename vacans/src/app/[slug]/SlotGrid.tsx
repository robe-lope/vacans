'use client'

import { useState } from 'react'
import { buildWaLink } from '@/lib/whatsapp'
import type { SlotsByTipo } from '@/lib/slots'
import type { TipoTurno } from '@/types'

const DAY_NAMES   = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTH_NAMES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
const FULL_DAY   = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado']

type Profesional = {
  id: string
  nombre_negocio: string
  descripcion: string | null
  telefono_wa: string
  foto_url: string | null
  color_primario: string
}

type Props = {
  profesional: Profesional
  tiposTurno: TipoTurno[]
  slotsByTipo: SlotsByTipo
  fechaDesde: string // 'YYYY-MM-DD'
}

function computeColorVars(hex: string): React.CSSProperties {
  const h = hex.startsWith('#') ? hex.slice(1) : hex
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const blend = (ratio: number) =>
    `rgb(${Math.round(r + (255 - r) * ratio)},${Math.round(g + (255 - g) * ratio)},${Math.round(b + (255 - b) * ratio)})`
  const darken = (ratio: number) =>
    `rgb(${Math.round(r * ratio)},${Math.round(g * ratio)},${Math.round(b * ratio)})`
  return {
    '--primary':     hex.startsWith('#') ? hex : `#${hex}`,
    '--primary-light': blend(0.6),
    '--primary-dark':  darken(0.7),
    '--primary-bg':    blend(0.95),
    '--primary-10':    `rgba(${r},${g},${b},0.1)`,
    '--primary-20':    `rgba(${r},${g},${b},0.2)`,
    '--text':          '#18181b',
    '--text-muted':    '#71717a',
    '--text-light':    '#a1a1aa',
    '--surface':       '#ffffff',
    '--surface-2':     '#fafafa',
    '--border':        '#e4e4e7',
    '--radius':        '14px',
    '--radius-sm':     '8px',
    '--radius-lg':     '20px',
  } as React.CSSProperties
}

function WaIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg" fill="#25d366"
      style={{ filter: 'drop-shadow(0 0 6px rgba(37,211,102,0.5))' }}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

export default function SlotGrid({ profesional, tiposTurno, slotsByTipo, fechaDesde }: Props) {
  const [selectedTipoId, setSelectedTipoId] = useState(tiposTurno[0]?.id ?? '')
  const [selectedDayIdx, setSelectedDayIdx]  = useState(0)
  const [selectedSlot, setSelectedSlot]       = useState<string | null>(null)

  const colorVars = computeColorVars(profesional.color_primario)

  // 14-day array built from fechaDesde (UTC)
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(fechaDesde + 'T00:00:00Z')
    d.setUTCDate(d.getUTCDate() + i)
    return d
  })

  const selectedDate  = days[selectedDayIdx]
  const selectedFecha = selectedDate.toISOString().slice(0, 10)
  const slotsForDay   = slotsByTipo[selectedTipoId]?.[selectedFecha] ?? []
  const selectedTipo  = tiposTurno.find(t => t.id === selectedTipoId)

  const dow = selectedDate.getUTCDay()
  const dayLabel = `${FULL_DAY[dow].charAt(0).toUpperCase() + FULL_DAY[dow].slice(1)} ${selectedDate.getUTCDate()} de ${MONTH_NAMES[selectedDate.getUTCMonth()]}`

  const initial = profesional.nombre_negocio.charAt(0).toUpperCase()

  function handleTipoClick(id: string) {
    setSelectedTipoId(id)
    setSelectedSlot(null)
  }

  function handleDayClick(idx: number) {
    setSelectedDayIdx(idx)
    setSelectedSlot(null)
  }

  function handleSlotClick(e: React.MouseEvent, hora: string) {
    e.stopPropagation()
    setSelectedSlot(prev => prev === hora ? null : hora)
  }

  function getWaUrl(hora: string): string {
    if (!selectedTipo) return '#'
    return buildWaLink({
      telefono:      profesional.telefono_wa,
      tipoTurno:     `${selectedTipo.nombre} (${selectedTipo.duracion_mins} min)`,
      fecha:         dayLabel,
      hora,
      nombreNegocio: profesional.nombre_negocio,
    })
  }

  return (
    <div
      className="min-h-screen pb-24 font-sans"
      style={{ ...colorVars, backgroundColor: 'var(--primary-bg)', color: 'var(--text)' }}
      onClick={() => setSelectedSlot(null)}
    >
      {/* ── HEADER ── */}
      <header
        className="sticky top-0 z-10 bg-white"
        style={{ borderBottom: '1px solid var(--border)', boxShadow: '0 1px 12px rgba(0,0,0,0.06)' }}
      >
        <div className="flex items-center gap-3.5 px-4 pt-5 mb-4">
          {/* Avatar */}
          <div
            className="rounded-full flex items-center justify-center text-white font-serif text-xl flex-shrink-0 overflow-hidden"
            style={{
              width: 52, height: 52,
              background: `linear-gradient(135deg, var(--primary), var(--primary-dark))`,
              border: '2px solid var(--primary-light)',
            }}
          >
            {profesional.foto_url
              ? <img src={profesional.foto_url} alt="" className="w-full h-full object-cover" />
              : initial}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="font-serif text-xl leading-tight truncate" style={{ color: 'var(--text)' }}>
              {profesional.nombre_negocio}
            </h1>
            {profesional.descripcion && (
              <p className="text-[13px] font-light mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                {profesional.descripcion}
              </p>
            )}
          </div>

          {/* Badge */}
          <span
            className="text-[10px] font-semibold tracking-widest uppercase px-2 py-1 rounded-full flex-shrink-0"
            style={{ color: 'var(--primary)', background: 'var(--primary-10)' }}
          >
            vacans
          </span>
        </div>

        {/* Tipo tabs */}
        {tiposTurno.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-3.5">
            {tiposTurno.map(tipo => {
              const active = tipo.id === selectedTipoId
              return (
                <button
                  key={tipo.id}
                  onClick={e => { e.stopPropagation(); handleTipoClick(tipo.id) }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full border-[1.5px] whitespace-nowrap text-[13px] font-medium flex-shrink-0"
                  style={active
                    ? { background: 'var(--primary)', borderColor: 'var(--primary)', color: 'white' }
                    : { background: 'transparent', borderColor: 'var(--border)', color: 'var(--text-muted)' }
                  }
                >
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'currentColor', opacity: 0.6 }} />
                  {tipo.nombre}
                  <span className="text-[11px] opacity-75">{tipo.duracion_mins} min</span>
                </button>
              )
            })}
          </div>
        )}
      </header>

      {/* ── DAYS ── */}
      <section className="px-4 pt-5" onClick={e => e.stopPropagation()}>
        <p className="text-[11px] font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--text-light)' }}>
          Días disponibles
        </p>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {days.map((d, i) => {
            const fecha    = d.toISOString().slice(0, 10)
            const hasSlots = (slotsByTipo[selectedTipoId]?.[fecha]?.length ?? 0) > 0
            const active   = i === selectedDayIdx
            return (
              <button
                key={i}
                onClick={() => handleDayClick(i)}
                className="relative flex flex-col items-center rounded-xl border-[1.5px] flex-shrink-0"
                style={{
                  minWidth: 54, padding: '10px 12px',
                  background:   active ? 'var(--primary)' : 'var(--surface)',
                  borderColor:  active ? 'var(--primary)' : 'var(--border)',
                  color:        active ? 'white' : 'var(--text)',
                  gap: 4,
                }}
              >
                <span
                  className="text-[11px] font-semibold tracking-[0.05em] uppercase"
                  style={{ opacity: active ? 0.85 : 0.65 }}
                >
                  {DAY_NAMES[d.getUTCDay()]}
                </span>
                <span className="font-serif text-xl leading-none">{d.getUTCDate()}</span>
                {hasSlots && (
                  <span
                    className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full"
                    style={{ background: active ? 'white' : 'var(--primary)' }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </section>

      {/* ── SLOTS ── */}
      <section className="px-4 pt-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg font-normal" style={{ color: 'var(--text)' }}>
            {dayLabel}
          </h2>
          <span
            className="text-xs px-2.5 py-0.5 rounded-full border"
            style={{ color: 'var(--text-muted)', background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          >
            {slotsForDay.length} turno{slotsForDay.length !== 1 ? 's' : ''}
          </span>
        </div>

        {slotsForDay.length === 0 ? (
          <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
            <div className="text-4xl mb-3 opacity-40">🗓</div>
            <p className="text-sm leading-relaxed">
              No hay turnos disponibles<br />este día. Probá con otro.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2.5">
            {slotsForDay.map(hora => {
              const [h]    = hora.split(':')
              const period = parseInt(h) < 12 ? 'AM' : 'PM'
              const active = selectedSlot === hora

              return (
                <div
                  key={hora}
                  className="relative overflow-hidden text-center cursor-pointer select-none"
                  style={{
                    background:   'var(--surface)',
                    border:       `1.5px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                    boxShadow:    active ? '0 0 0 2.5px var(--primary)' : undefined,
                    borderRadius: 'var(--radius)',
                    padding:      '18px 10px',
                  }}
                  onClick={e => handleSlotClick(e, hora)}
                >
                  <div className="font-serif leading-none" style={{ fontSize: 22, color: 'var(--text)' }}>
                    {hora}
                  </div>
                  <div
                    className="text-[10px] font-semibold uppercase tracking-[0.05em] mt-0.5"
                    style={{ color: 'var(--text-light)' }}
                  >
                    {period}
                  </div>

                  {/* Spring overlay */}
                  <a
                    href={active ? getWaUrl(hora) : undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 flex flex-col items-center justify-center gap-1.5"
                    style={{
                      background:   'rgba(0,0,0,0.72)',
                      borderRadius: 'calc(var(--radius) - 2px)',
                      opacity:      active ? 1 : 0,
                      transform:    active ? 'scale(1)' : 'scale(0.92)',
                      transition:   'all 0.2s cubic-bezier(0.34, 1.3, 0.64, 1)',
                      pointerEvents: active ? 'all' : 'none',
                    }}
                    onClick={e => {
                      e.stopPropagation()
                      // Fire-and-forget: record solicitud in DB
                      fetch('/api/solicitudes', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          profesional_id: profesional.id,
                          tipo_turno_id:  selectedTipoId,
                          fecha:          selectedFecha,
                          hora_inicio:    hora,
                        }),
                      }).catch(() => {})
                    }}
                  >
                    <WaIcon />
                    <span className="text-[12px] font-bold text-white uppercase tracking-[0.04em]">
                      reservar
                    </span>
                  </a>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── FOOTER ── */}
      <footer
        className="fixed bottom-0 left-0 right-0 text-center bg-white z-10"
        style={{ borderTop: '1px solid var(--border)', padding: '10px 0' }}
      >
        <a
          href="https://vacans.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs flex items-center justify-center gap-1.5"
          style={{ color: 'var(--text-light)', textDecoration: 'none' }}
        >
          Gestionado con{' '}
          <span style={{ fontWeight: 600, color: 'var(--primary)' }}>vacans</span>
          {' '}· Creá tu página gratis
        </a>
      </footer>
    </div>
  )
}
