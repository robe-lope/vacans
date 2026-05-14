'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, CalendarDays, User, Scissors,
  Clock, Palette, LogOut, Menu, X, ExternalLink,
} from 'lucide-react'
import { logout } from '@/app/(auth)/actions'

const MAIN_NAV = [
  { label: 'Inicio', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Turnos', href: '/dashboard/turnos', icon: CalendarDays },
]
const CONFIG_NAV = [
  { label: 'Perfil', href: '/dashboard/configuracion/perfil', icon: User },
  { label: 'Tipos de turno', href: '/dashboard/configuracion/tipos', icon: Scissors },
  { label: 'Horarios', href: '/dashboard/configuracion/disponibilidad', icon: Clock },
  { label: 'Apariencia', href: '/dashboard/configuracion/apariencia', icon: Palette },
]

type Props = { nombreNegocio: string | null; slug: string | null; email: string }

export default function Sidebar({ nombreNegocio, slug, email }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  function linkClass(href: string) {
    const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href)
    return `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      active
        ? 'bg-indigo-50 text-indigo-700'
        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
    }`
  }

  const navContent = (
    <>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {MAIN_NAV.map(({ label, href, icon: Icon }) => (
          <Link key={href} href={href} className={linkClass(href)} onClick={() => setOpen(false)}>
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
        <div className="pt-5">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
            Configuración
          </p>
          {CONFIG_NAV.map(({ label, href, icon: Icon }) => (
            <Link key={href} href={href} className={linkClass(href)} onClick={() => setOpen(false)}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          ))}
        </div>
      </nav>
      <div className="px-4 py-4 border-t border-zinc-100 space-y-3">
        {slug && (
          <a
            href={`/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-indigo-600 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Ver mi página
          </a>
        )}
        <div>
          <p className="text-xs font-medium text-zinc-700 truncate">{nombreNegocio}</p>
          <p className="text-[11px] text-zinc-400 truncate">{email}</p>
        </div>
        <form action={logout}>
          <button type="submit" className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-red-500 transition-colors">
            <LogOut className="w-3.5 h-3.5" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 bg-white border-b border-zinc-200 flex items-center gap-3 px-4 h-14">
        <button onClick={() => setOpen(true)} className="p-1.5 rounded-lg hover:bg-zinc-100">
          <Menu className="w-5 h-5 text-zinc-600" />
        </button>
        <span className="font-bold text-sm text-zinc-900">vacans</span>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-60 bg-white border-r border-zinc-200 z-20">
        <div className="px-5 py-5 border-b border-zinc-100">
          <span className="text-lg font-bold tracking-tight text-zinc-900">vacans</span>
        </div>
        {navContent}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="relative flex flex-col w-64 bg-white z-50">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
              <span className="font-bold text-zinc-900">vacans</span>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-zinc-100">
                <X className="w-4 h-4 text-zinc-600" />
              </button>
            </div>
            {navContent}
          </aside>
        </div>
      )}
    </>
  )
}
