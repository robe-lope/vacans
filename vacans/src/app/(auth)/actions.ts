'use server'

import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'

type ActionResult = { error?: string; emailPendiente?: boolean }

export async function login(formData: FormData): Promise<ActionResult | void> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) return { error: error.message }

  redirect('/dashboard')
}

export async function register(formData: FormData): Promise<ActionResult | void> {
  const supabase = await createClient()
  const serviceClient = createServiceClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const slug = formData.get('slug') as string
  const nombreNegocio = formData.get('nombre_negocio') as string
  const telefonoWa = formData.get('telefono_wa') as string

  // Verificar slug disponible antes de crear el usuario
  const { data: existing } = await serviceClient
    .from('profesionales')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (existing) return { error: 'Ese slug ya está en uso. Elegí otro.' }

  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) return { error: error.message }
  if (!data.user) return { error: 'No se pudo crear la cuenta.' }

  const { error: profError } = await serviceClient
    .from('profesionales')
    .insert({
      user_id: data.user.id,
      slug,
      nombre_negocio: nombreNegocio,
      telefono_wa: telefonoWa,
      email_contacto: email,
    })

  if (profError) return { error: profError.message }

  // Si Supabase requiere confirmación de email, no hay sesión todavía
  if (!data.session) {
    return { emailPendiente: true }
  }

  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
