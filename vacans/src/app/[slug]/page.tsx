import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generarSlots } from '@/lib/slots'
import SlotGrid from './SlotGrid'

export const revalidate = 60

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('profesionales')
    .select('nombre_negocio, descripcion')
    .eq('slug', slug)
    .eq('activo', true)
    .single()

  if (!data) return { title: 'Vacans' }
  return {
    title: `${data.nombre_negocio} — Vacans`,
    description: data.descripcion ?? 'Reservá tu turno online',
    openGraph: {
      title: `${data.nombre_negocio} — Vacans`,
      description: data.descripcion ?? 'Reservá tu turno online',
      images: [`/api/og/${slug}`],
    },
    twitter: {
      card: 'summary_large_image',
      images: [`/api/og/${slug}`],
    },
  }
}

export default async function PublicPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()
  const serviceClient = createServiceClient()

  const { data: profesional } = await supabase
    .from('profesionales')
    .select('id, nombre_negocio, descripcion, telefono_wa, foto_url, color_primario, activo')
    .eq('slug', slug)
    .eq('activo', true)
    .single()

  if (!profesional) notFound()

  // 14-day window starting today (UTC)
  const todayUTC = new Date().toISOString().slice(0, 10)
  const finUTC = new Date()
  finUTC.setUTCDate(finUTC.getUTCDate() + 13)
  const hastaUTC = finUTC.toISOString().slice(0, 10)

  const [tiposRes, dispRes, overridesRes, solicitRes] = await Promise.all([
    supabase
      .from('tipos_turno')
      .select('*')
      .eq('profesional_id', profesional.id)
      .eq('activo', true)
      .order('orden', { ascending: true }),
    supabase
      .from('disponibilidad')
      .select('*')
      .eq('profesional_id', profesional.id),
    supabase
      .from('slot_overrides')
      .select('*')
      .eq('profesional_id', profesional.id)
      .gte('fecha', todayUTC)
      .lte('fecha', hastaUTC),
    serviceClient
      .from('solicitudes')
      .select('fecha, hora_inicio, tipo_turno_id')
      .eq('profesional_id', profesional.id)
      .eq('estado', 'confirmado')
      .gte('fecha', todayUTC)
      .lte('fecha', hastaUTC),
  ])

  const tiposTurno = tiposRes.data ?? []
  const disponibilidad = dispRes.data ?? []
  const overrides = overridesRes.data ?? []
  const solicitudesConfirmadas = (solicitRes.data ?? []).map(s => ({
    fecha: s.fecha,
    hora_inicio: s.hora_inicio,
    tipo_turno_id: s.tipo_turno_id,
  }))

  const slotsByTipo = generarSlots({
    tiposTurno,
    disponibilidad,
    overrides,
    solicitudesConfirmadas,
    fechaDesde: todayUTC,
    fechaHasta: hastaUTC,
  })

  return (
    <SlotGrid
      profesional={{
        id:             profesional.id,
        nombre_negocio: profesional.nombre_negocio,
        descripcion:    profesional.descripcion ?? null,
        telefono_wa:    profesional.telefono_wa,
        foto_url:       profesional.foto_url ?? null,
        color_primario: profesional.color_primario ?? '#CC0000',
      }}
      tiposTurno={tiposTurno}
      slotsByTipo={slotsByTipo}
      fechaDesde={todayUTC}
    />
  )
}
