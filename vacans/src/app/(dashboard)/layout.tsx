import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profesional } = await supabase
    .from('profesionales')
    .select('nombre_negocio, slug')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-zinc-50">
      <Sidebar
        nombreNegocio={profesional?.nombre_negocio ?? null}
        slug={profesional?.slug ?? null}
        email={user.email!}
      />
      <div className="md:hidden h-14" />
      <main className="md:pl-60">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
