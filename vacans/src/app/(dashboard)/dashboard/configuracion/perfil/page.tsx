import { createClient } from '@/lib/supabase/server'
import PerfilForm from './PerfilForm'

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profesional } = await supabase
    .from('profesionales')
    .select('nombre_negocio, descripcion, telefono_wa, slug, email_contacto')
    .eq('user_id', user!.id)
    .single()

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Perfil del negocio</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Datos que se muestran en tu página pública.</p>
      </div>
      <PerfilForm profesional={profesional} />
    </div>
  )
}
