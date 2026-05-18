const GRAPH_API_URL = 'https://graph.facebook.com/v23.0'

export async function notificarProfesional(params: {
  telefonoProfesional: string
  nombreCliente: string
  tipoTurno: string
  fecha: string
  hora: string
  solicitudId: string
}): Promise<boolean> {
  const res = await fetch(
    `${GRAPH_API_URL}/${process.env.WA_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.WA_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: params.telefonoProfesional,
        type: 'template',
        template: {
          name: process.env.WA_TEMPLATE_NUEVA_SOLICITUD,
          language: { code: 'es_AR' },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: params.nombreCliente },
                { type: 'text', text: params.tipoTurno },
                { type: 'text', text: params.fecha },
                { type: 'text', text: params.hora },
              ],
            },
          ],
        },
      }),
    }
  )
  if (!res.ok) {
    const body = await res.text().catch(() => '(no body)')
    console.error(`[WA] notificarProfesional falló — status ${res.status}:`, body)
  }
  return res.ok
}

export async function enviarMensajeTexto(
  telefono: string,
  texto: string
): Promise<boolean> {
  const res = await fetch(
    `${GRAPH_API_URL}/${process.env.WA_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.WA_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: telefono,
        type: 'text',
        text: { body: texto },
      }),
    }
  )
  return res.ok
}
