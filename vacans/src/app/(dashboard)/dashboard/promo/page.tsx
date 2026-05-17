import { createClient } from '@/lib/supabase/server'
import PromoClient from './PromoClient'

export default async function PromoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profesional } = await supabase
    .from('profesionales')
    .select('id')
    .eq('user_id', user!.id)
    .single()

  const today = new Date().toISOString().slice(0, 10)

  const { data: activePromo } = await supabase
    .from('promos')
    .select('id, imagen_url, caduca_en')
    .eq('profesional_id', profesional!.id)
    .gte('caduca_en', today)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Promo semanal</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Subí una imagen que se mostrará en tu página pública mientras esté vigente.
        </p>
      </div>
      <PromoClient
        profesionalId={profesional!.id}
        activePromo={activePromo ?? null}
      />
    </div>
  )
}
