export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode      = searchParams.get('hub.mode')
  const token     = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WA_WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 })
  }
  return new Response('Forbidden', { status: 403 })
}

export async function POST(request: Request) {
  const body = await request.json()

  const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
  if (!message) return new Response('OK', { status: 200 })

  const from = message.from as string
  const text = (message.text?.body as string | undefined)?.toLowerCase().trim()

  // V1: log only. V2: parse and update solicitud estado.
  console.log(`[WA webhook] de ${from}: ${text}`)

  return new Response('OK', { status: 200 })
}
