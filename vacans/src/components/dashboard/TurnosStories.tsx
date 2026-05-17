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

export default function TurnosStories({ profesional, slotsResumen }: Props) {
  const color   = profesional.color_primario || '#CC0000'
  const initial = profesional.nombre_negocio.charAt(0).toUpperCase()

  return (
    <div
      style={{
        width: 540, height: 960,
        background: '#fafafa',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ background: color, padding: '52px 40px 40px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Avatar */}
        <div style={{
          width: 80, height: 80, borderRadius: 40,
          background: 'rgba(255,255,255,0.2)',
          border: '3px solid rgba(255,255,255,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', flexShrink: 0,
        }}>
          {profesional.foto_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profesional.foto_url}
              alt=""
              crossOrigin="anonymous"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{ fontSize: 34, fontWeight: 700, color: 'white' }}>{initial}</span>
          )}
        </div>
        <div>
          <div style={{ fontSize: 30, fontWeight: 700, color: 'white', lineHeight: 1.2 }}>
            {profesional.nombre_negocio}
          </div>
          <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.75)', marginTop: 6 }}>
            Turnos disponibles esta semana
          </div>
        </div>
      </div>

      {/* Days */}
      <div style={{ flex: 1, padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {slotsResumen.map(dia => (
          <div
            key={dia.fecha}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '15px 22px', borderRadius: 14,
              background: dia.count > 0 ? 'white' : '#f4f4f5',
              border: '1.5px solid #e4e4e7',
            }}
          >
            <span style={{
              fontSize: 19, fontWeight: 600,
              color: dia.count > 0 ? '#18181b' : '#a1a1aa',
              textTransform: 'capitalize',
            }}>
              {dia.diaNombre}
            </span>
            {dia.count > 0 ? (
              <span style={{
                fontSize: 15, fontWeight: 600,
                color: 'white', background: color,
                padding: '5px 16px', borderRadius: 50,
              }}>
                {dia.count} {dia.count === 1 ? 'turno' : 'turnos'}
              </span>
            ) : (
              <span style={{ fontSize: 15, color: '#a1a1aa' }}>Sin turnos</span>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding: '20px 32px 28px',
        borderTop: '1px solid #e4e4e7',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 13, color: '#71717a' }}>Reservá tu turno en</span>
          <span style={{ fontSize: 16, fontWeight: 700, color }}>
            vacans.vercel.app/{profesional.slug}
          </span>
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#d4d4d8', letterSpacing: '-0.3px' }}>
          vacans
        </span>
      </div>
    </div>
  )
}
