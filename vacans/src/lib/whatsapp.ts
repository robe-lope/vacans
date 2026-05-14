export function buildWaLink(params: {
  telefono: string
  tipoTurno: string     // "Depilación (30 min)"
  fecha: string          // "martes 20 de mayo"
  hora: string           // "15:30"
  nombreNegocio: string
}): string {
  const mensaje = encodeURIComponent(
    `Hola ${params.nombreNegocio}! 👋 Quiero reservar el siguiente turno:\n\n` +
    `📅 *${params.fecha}* a las *${params.hora}*\n` +
    `✂️ *${params.tipoTurno}*\n\n` +
    `_Enviado desde vacans.vercel.app_`
  )
  return `https://wa.me/${params.telefono}?text=${mensaje}`
}
