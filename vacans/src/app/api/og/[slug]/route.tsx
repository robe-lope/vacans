import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

type Params = { params: Promise<{ slug: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const { data: p } = await supabase
    .from('profesionales')
    .select('nombre_negocio, descripcion, foto_url, color_primario')
    .eq('slug', slug)
    .eq('activo', true)
    .single()

  const nombre      = p?.nombre_negocio ?? 'Vacans'
  const descripcion = p?.descripcion    ?? 'Reservá tu turno online'
  const fotoUrl     = p?.foto_url       ?? null
  const color       = p?.color_primario ?? '#CC0000'
  const initial     = nombre.charAt(0).toUpperCase()

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex', width: '100%', height: '100%',
          background: '#FAFAFA', position: 'relative', fontFamily: 'sans-serif',
        }}
      >
        {/* Color stripe */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 8, background: color }} />

        {/* Main content */}
        <div
          style={{
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            padding: '60px 80px 60px 88px', gap: 32, flex: 1,
          }}
        >
          {/* Avatar + text */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
            <div
              style={{
                width: 120, height: 120, borderRadius: 60, overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: color, color: 'white', fontSize: 52, fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {fotoUrl
                ? <img src={fotoUrl} width={120} height={120} style={{ objectFit: 'cover' }} alt="" />
                : initial}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 56, fontWeight: 700, color: '#18181b', lineHeight: 1.1 }}>
                {nombre}
              </div>
              {descripcion && (
                <div style={{ fontSize: 28, color: '#71717a', fontWeight: 400, lineHeight: 1.3 }}>
                  {descripcion.slice(0, 80)}
                </div>
              )}
            </div>
          </div>

          {/* CTA pill */}
          <div
            style={{
              display: 'flex', alignSelf: 'flex-start',
              background: color, color: 'white',
              padding: '16px 36px', borderRadius: 50,
              fontSize: 26, fontWeight: 600,
            }}
          >
            Reservá tu turno →
          </div>
        </div>

        {/* Wordmark */}
        <div
          style={{
            position: 'absolute', bottom: 44, right: 64,
            fontSize: 30, fontWeight: 700, color: '#a1a1aa', letterSpacing: '-0.5px',
          }}
        >
          vacans
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
