import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: existing } = await supabase
          .from('profesionales')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (!existing) {
          const service = createServiceClient()

          const emailPrefix = (user.email ?? 'usuario').split('@')[0]
          const baseSlug = emailPrefix
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 20) || 'usuario'

          const suffix = Math.random().toString(36).slice(2, 6)
          const slug = `${baseSlug}-${suffix}`

          const fullName = (user.user_metadata?.full_name as string | undefined) ?? ''
          const nombre_negocio = fullName.trim() || emailPrefix

          await service.from('profesionales').insert({
            user_id:        user.id,
            slug,
            nombre_negocio,
            descripcion:    null,
            telefono_wa:    '',
            email_contacto: user.email ?? '',
            color_primario: '#CC0000',
            color_acento:   '#FF3333',
          })
        }
      }

      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth`)
}
