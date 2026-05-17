import { createServiceClient } from '@/lib/supabase/server'
import { enviarMensajeTexto } from '@/lib/whatsapp-meta'

type PromoWithProf = {
  id: string
  profesionales: { telefono_wa: string; slug: string } | null
}

export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createServiceClient()
  const today    = new Date().toISOString().slice(0, 10)

  const { data } = await supabase
    .from('promos')
    .select('id, profesionales(telefono_wa, slug)')
    .lte('caduca_en', today)
    .eq('notificacion_enviada', false)

  const promos = (data ?? []) as unknown as PromoWithProf[]

  for (const promo of promos) {
    const prof = promo.profesionales
    if (prof?.telefono_wa) {
      await enviarMensajeTexto(
        prof.telefono_wa,
        `📢 Tu promo semanal en Vacans venció hoy.\n\nPodés subir una nueva desde tu dashboard:\nvacans.vercel.app/dashboard/promo`
      )
    }
    await supabase.from('promos').update({ notificacion_enviada: true }).eq('id', promo.id)
  }

  return Response.json({ ok: true, processed: promos.length })
}
