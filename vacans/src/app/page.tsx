import Link from 'next/link'

const FEATURES = [
  {
    icon: '📅',
    title: 'Grilla de turnos en segundos',
    desc: 'Configurás tus días y horarios, y tu página pública queda lista al instante.',
  },
  {
    icon: '💬',
    title: 'Reservas por WhatsApp',
    desc: 'El cliente elige un turno y te manda un mensaje pre-armado a tu WhatsApp. Cero fricción.',
  },
  {
    icon: '🎨',
    title: 'Tu marca, tus colores',
    desc: 'Personalizá la paleta de colores para que tu página refleje tu identidad.',
  },
  {
    icon: '✅',
    title: 'Confirmá o rechazá desde el panel',
    desc: 'Gestioná todos tus turnos desde un dashboard simple y limpio.',
  },
]

const TESTIMONIOS = [
  {
    text: 'En 10 minutos armé mi página y ya tengo mis clientas reservando solas. Increíble.',
    name: 'Laura M.',
    role: 'Depiladora, Buenos Aires',
  },
  {
    text: 'Mis pacientes pueden ver mis horarios disponibles sin que yo tenga que contestar cada consulta.',
    name: 'Dra. Carla G.',
    role: 'Psicóloga, Córdoba',
  },
  {
    text: 'Lo que más me gustó es que no necesité saber de tecnología. Se hace solo.',
    name: 'Martín P.',
    role: 'Peluquero, Rosario',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-zinc-100">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-serif text-xl text-zinc-900">vacans</span>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="text-sm bg-zinc-900 text-white px-4 py-2 rounded-full hover:bg-zinc-700 transition-colors"
            >
              Empezar gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-28 pb-20 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-red-600 bg-red-50 px-3 py-1 rounded-full mb-6">
            Para emprendedores independientes
          </span>
          <h1 className="font-serif text-5xl sm:text-6xl text-zinc-900 leading-tight mb-6">
            Tu página de turnos,<br />
            <span className="italic text-red-600">lista en minutos.</span>
          </h1>
          <p className="text-lg text-zinc-500 leading-relaxed mb-10 max-w-lg mx-auto">
            Vacans es la forma más simple de que tus clientes vean tus horarios disponibles
            y reserven por WhatsApp. Sin apps, sin complicaciones.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-red-600 text-white text-sm font-semibold px-8 py-3.5 rounded-full hover:bg-red-700 transition-colors"
            >
              Crear mi página gratis →
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-zinc-100 text-zinc-700 text-sm font-semibold px-8 py-3.5 rounded-full hover:bg-zinc-200 transition-colors"
            >
              Ya tengo cuenta
            </Link>
          </div>
          <p className="text-xs text-zinc-400 mt-5">Gratis para siempre. Sin tarjeta de crédito.</p>
        </div>
      </section>

      {/* MOCK PHONE */}
      <section className="pb-20 px-6 flex justify-center">
        <div
          className="w-64 rounded-3xl overflow-hidden shadow-2xl border border-zinc-200"
          style={{ fontFamily: 'var(--font-sans, system-ui)' }}
        >
          {/* Mini app header */}
          <div className="bg-white border-b border-zinc-100 px-3 pt-3 pb-0">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center text-white text-sm font-bold">
                M
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-900">María Depilación</p>
                <p className="text-[10px] text-zinc-400">Flores, CABA</p>
              </div>
              <span className="ml-auto text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full uppercase tracking-wide">vacans</span>
            </div>
            <div className="flex gap-1.5 pb-2.5 overflow-x-hidden">
              <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-red-600 text-white whitespace-nowrap">Definitiva 30 min</span>
              <span className="text-[10px] font-medium px-2.5 py-1 rounded-full border border-zinc-200 text-zinc-500 whitespace-nowrap">Cejas 15 min</span>
            </div>
          </div>
          <div className="bg-red-50 p-2.5">
            <div className="grid grid-cols-3 gap-1.5">
              {['9:00','9:30','10:00','10:30','11:00','11:30'].map(t => (
                <div
                  key={t}
                  className="bg-white rounded-lg text-center py-2 text-[11px] font-semibold text-zinc-800 border border-zinc-100"
                  style={{ fontFamily: 'var(--font-sans, system-ui)' }}
                >
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 px-6 bg-zinc-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl text-zinc-900 text-center mb-12">
            Todo lo que necesitás, nada de lo que no.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-white rounded-2xl border border-zinc-200 p-6">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-zinc-900 mb-1.5">{f.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl text-zinc-900 text-center mb-12">
            Lo que dicen quienes ya lo usan
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {TESTIMONIOS.map(t => (
              <div key={t.name} className="bg-zinc-50 rounded-2xl border border-zinc-100 p-5">
                <p className="text-sm text-zinc-600 leading-relaxed mb-4 italic">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{t.name}</p>
                  <p className="text-xs text-zinc-400">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 px-6 bg-zinc-900 text-center">
        <div className="max-w-lg mx-auto">
          <h2 className="font-serif text-4xl text-white mb-4">
            Empezá hoy, gratis.
          </h2>
          <p className="text-zinc-400 mb-8 text-sm leading-relaxed">
            Creá tu página de turnos en menos de 5 minutos.<br />
            Sin tarjeta, sin contratos, sin vueltas.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-white text-zinc-900 text-sm font-semibold px-8 py-3.5 rounded-full hover:bg-zinc-100 transition-colors"
          >
            Crear mi página gratis →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 px-6 border-t border-zinc-100 text-center">
        <p className="text-xs text-zinc-400">
          © {new Date().getFullYear()} Vacans · Hecho en Argentina 🇦🇷
        </p>
      </footer>
    </div>
  )
}
