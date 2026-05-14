# CLAUDE.md — Vacans

> App de gestión y visualización de turnos para emprendedores.  
> Stack: Next.js 14 (App Router) + Supabase + Vercel + Resend + Meta WhatsApp Cloud API  
> Dominio: vacans.xyz

---

## 🚦 Estado actual del proyecto (leer primero)

El desarrollador ya completó todos los pasos de `vacans-v0.md`. Esto significa que al arrancar Claude Code ya están listos:

- ✅ Repo GitHub inicializado con Next.js 14 + TypeScript + Tailwind + shadcn/ui
- ✅ Proyecto Supabase creado (región São Paulo)
- ✅ Proyecto Vercel creado y conectado al repo, dominio `vacans.xyz` apuntado
- ✅ Resend configurado con dominio `vacans.xyz` verificado
- ✅ Meta Developer App creada con WhatsApp Cloud API habilitada
- ✅ System User de Meta con token permanente generado
- ✅ Template de WhatsApp `nueva_solicitud_turno` aprobado
- ✅ Webhook de Meta apuntando a `https://vacans.xyz/api/whatsapp/webhook`
- ✅ `.env.local` completo con todas las variables

**Claude Code debe asumir que la infraestructura existe y arrancar directo con el código.**  
No hay que crear proyectos, configurar servicios externos ni explicar setup — todo eso ya está.

---

## 🧭 Visión general

Vacans es una herramienta SaaS liviana que permite a cualquier profesional independiente (depiladora, psicóloga, peluquero, tutora, etc.) tener su propia página pública de turnos disponibles, personalizada con su marca, sin necesidad de conocimientos técnicos.

El cliente final (quien pide el turno) ve una grilla limpia de slots disponibles, elige uno, y es redirigido a WhatsApp con un mensaje pre-armado. La app notifica al profesional por **email (Resend) y WhatsApp (Meta Cloud API)**. El profesional gestiona el estado de sus turnos desde un dashboard privado.

**No hay pagos de ningún tipo en la app** (salvo suscripción del profesional). No se procesa ni reserva nada — solo se solicita.

---

## 🗂 Estructura del proyecto

```
vacans/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx               # sidebar + navbar autenticado
│   │   ├── dashboard/page.tsx       # resumen: turnos pendientes hoy
│   │   ├── turnos/page.tsx          # lista de todos los turnos con estados
│   │   ├── configuracion/
│   │   │   ├── perfil/page.tsx      # datos del negocio, foto, descripción
│   │   │   ├── tipos/page.tsx       # tipos de turno (max 2 free)
│   │   │   ├── disponibilidad/page.tsx  # días y horarios
│   │   │   └── apariencia/page.tsx  # paleta de colores
│   ├── [slug]/page.tsx              # página pública del profesional
│   └── page.tsx                     # landing de Vacans
├── components/
│   ├── ui/                          # shadcn/ui components
│   ├── public/
│   │   ├── SlotGrid.tsx             # grilla de turnos públicos
│   │   ├── SlotCard.tsx
│   │   └── ProfesionalHeader.tsx
│   └── dashboard/
│       ├── TurnoCard.tsx
│       ├── TipoTurnoForm.tsx
│       └── DisponibilidadEditor.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── slots.ts                     # lógica de generación de grilla
│   ├── whatsapp.ts                  # construcción de links wa.me (cliente → profesional)
│   ├── whatsapp-meta.ts             # Meta Cloud API: envío de WA al profesional
│   ├── resend.ts                    # envío de emails
│   └── utils.ts
├── types/
│   └── index.ts
└── CLAUDE.md
```

---

## 🗄 Base de datos (Supabase)

### Tabla: `profesionales`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE
slug            text UNIQUE NOT NULL          -- ej: "maria-depilacion"
nombre_negocio  text NOT NULL
descripcion     text
telefono_wa     text NOT NULL                 -- formato: 5491112345678
email_contacto  text NOT NULL
foto_url        text
color_primario  text DEFAULT '#6366f1'        -- hex
color_acento    text DEFAULT '#f59e0b'        -- hex
plan            text DEFAULT 'free'           -- 'free' | 'premium'
activo          boolean DEFAULT true
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

### Tabla: `tipos_turno`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
profesional_id  uuid REFERENCES profesionales(id) ON DELETE CASCADE
nombre          text NOT NULL               -- ej: "Depilación", "Cejas"
duracion_mins   integer NOT NULL            -- 15, 20, 30, 45, 60, etc.
descripcion     text
precio_display  text                        -- opcional, solo visual: "$5000"
color           text                        -- color badge en la grilla
activo          boolean DEFAULT true
orden           integer DEFAULT 0
created_at      timestamptz DEFAULT now()

-- Constraint: max 2 por profesional en plan free
```

### Tabla: `disponibilidad`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
profesional_id  uuid REFERENCES profesionales(id) ON DELETE CASCADE
dia_semana      integer NOT NULL            -- 0=Dom, 1=Lun, ..., 6=Sab
hora_inicio     time NOT NULL               -- ej: 09:00
hora_fin        time NOT NULL               -- ej: 18:00
activo          boolean DEFAULT true
```

### Tabla: `slot_overrides`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
profesional_id  uuid REFERENCES profesionales(id) ON DELETE CASCADE
fecha           date NOT NULL
hora_inicio     time NOT NULL
tipo_turno_id   uuid REFERENCES tipos_turno(id)
tipo            text NOT NULL               -- 'agregar' | 'quitar'
motivo          text                        -- interno, no visible
created_at      timestamptz DEFAULT now()
```

### Tabla: `solicitudes`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
profesional_id  uuid REFERENCES profesionales(id) ON DELETE CASCADE
tipo_turno_id   uuid REFERENCES tipos_turno(id)
fecha           date NOT NULL
hora_inicio     time NOT NULL
nombre_cliente  text NOT NULL
telefono_cliente text                       -- opcional
email_cliente   text                        -- opcional, para notificación
estado          text DEFAULT 'pendiente'    -- 'pendiente' | 'confirmado' | 'rechazado'
notas           text
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

### RLS Policies
- `profesionales`: SELECT público (para páginas /[slug]), INSERT/UPDATE/DELETE solo owner
- `tipos_turno`: SELECT público, INSERT/UPDATE/DELETE solo owner del profesional
- `disponibilidad`: ídem
- `slot_overrides`: ídem
- `solicitudes`: INSERT público (cualquiera puede crear), SELECT/UPDATE solo owner

---

## ⚙️ Lógica de negocio

### Generación de grilla de slots (`lib/slots.ts`)

```typescript
// Dado un profesional y un rango de fechas, generar todos los slots disponibles

function generarSlots(
  profesional: Profesional,
  tiposTurno: TipoTurno[],
  disponibilidad: Disponibilidad[],
  overrides: SlotOverride[],
  solicitudesConfirmadas: Solicitud[],
  fechaDesde: Date,
  fechaHasta: Date
): Slot[]
```

**Algoritmo:**
1. Iterar cada día en el rango
2. Verificar si el `dia_semana` está en `disponibilidad` y está activo
3. Para cada `tipo_turno` activo: generar slots desde `hora_inicio` hasta `hora_fin` cada `duracion_mins`
4. Aplicar `slot_overrides` tipo `quitar` (eliminar ese slot)
5. Aplicar `slot_overrides` tipo `agregar` (agregar ese slot aunque no esté en disponibilidad regular)
6. Eliminar slots que ya tienen `solicitudes` con estado `confirmado`
7. **No bloquear** solicitudes `pendientes` — el profesional decide
8. Retornar slots ordenados por fecha y hora

**Rango de visualización:** mostrar los próximos **14 días** por defecto.

### Construcción del link de WhatsApp (`lib/whatsapp.ts`)

```typescript
function buildWaLink(params: {
  telefono: string       // 5491112345678
  nombreCliente: string
  tipoTurno: string      // "Depilación (30 min)"
  fecha: string          // "martes 20 de mayo"
  hora: string           // "15:30"
  nombreNegocio: string
}): string {
  const mensaje = encodeURIComponent(
    `Hola ${params.nombreNegocio}! 👋 Soy ${params.nombreCliente} y quisiera reservar el turno:\n\n` +
    `📅 *${params.fecha}* a las *${params.hora}*\n` +
    `✂️ *${params.tipoTurno}*\n\n` +
    `¿Podés confirmarme? ¡Gracias!`
  )
  return `https://wa.me/${params.telefono}?text=${mensaje}`
}
```

### Email de notificación al profesional (`lib/resend.ts`)

Cuando el usuario hace click en "Solicitar turno", se llama a `/api/solicitudes` que:

1. Inserta la solicitud en Supabase con estado `pendiente`
2. Envía email via Resend al profesional
3. Envía WhatsApp via Meta Cloud API al profesional (ver sección siguiente)

```
Asunto: 📅 Nueva solicitud — [Tipo] el [Fecha] a las [Hora]

[Nombre cliente] quiere reservar [Tipo turno] ([duración])
📅 [Día, fecha] a las [hora]

→ [Botón: Ver en dashboard]  (link directo a /dashboard/turnos?id=xxx)
```

### WhatsApp al profesional via Meta Cloud API (`lib/whatsapp-meta.ts`)

Esta es la notificación principal al profesional. Se usa el template aprobado `nueva_solicitud_turno`.

```typescript
// lib/whatsapp-meta.ts

const GRAPH_API_URL = 'https://graph.facebook.com/v23.0'

export async function notificarProfesional(params: {
  telefonoProfesional: string  // formato internacional sin +: "5491112345678"
  nombreCliente: string
  tipoTurno: string            // "Depilación (30 min)"
  fecha: string                // "martes 20 de mayo"
  hora: string                 // "15:30"
  solicitudId: string          // para el link directo al dashboard
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
  return res.ok
}
```

### Webhook entrante de WhatsApp (`app/api/whatsapp/webhook/route.ts`)

Meta envía eventos a este endpoint cuando el profesional responde o interactúa.

```typescript
// GET — verificación del webhook (solo una vez al configurar)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WA_WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 })
  }
  return new Response('Forbidden', { status: 403 })
}

// POST — mensajes y eventos entrantes
export async function POST(request: Request) {
  const body = await request.json()

  // Extraer mensaje entrante
  const entry = body.entry?.[0]
  const change = entry?.changes?.[0]
  const message = change?.value?.messages?.[0]

  if (!message) return new Response('OK', { status: 200 })

  const from = message.from        // número del profesional
  const text = message.text?.body?.toLowerCase().trim()

  // V1: loggear el mensaje, sin lógica de bot todavía
  // V2: parsear respuestas y actualizar estado en Supabase
  console.log(`Mensaje de ${from}: ${text}`)

  return new Response('OK', { status: 200 })
}
```

> **V1**: el webhook solo loggea. El profesional confirma/rechaza desde el dashboard.  
> **V2**: si el profesional responde "1" o "confirmar", el webhook actualiza el estado en Supabase y notifica al cliente.

### Límite de plan free

En `tipos_turno`, antes de insertar, verificar:
```sql
SELECT COUNT(*) FROM tipos_turno 
WHERE profesional_id = $1 AND activo = true
```
Si count >= 2 y plan = 'free' → retornar error 403 con mensaje claro.

---

## 🎨 Sistema de personalización

El profesional puede elegir:

### Paleta de colores
- **Color primario**: botones, headers, badges principales
- **Color acento**: highlights, hover states, badges secundarios
- **Presets sugeridos** (en `/configuracion/apariencia`):
  - 🟣 Violeta Spa: `#7c3aed` / `#f0abfc`
  - 🌿 Verde Natura: `#16a34a` / `#bbf7d0`
  - 🔵 Azul Clínica: `#2563eb` / `#93c5fd`
  - 🌸 Rosa Estética: `#db2777` / `#fbcfe8`
  - ⚫ Negro Minimal: `#171717` / `#a3a3a3`
  - 🟠 Naranja Energía: `#ea580c` / `#fed7aa`

Los colores se aplican via CSS variables en la página pública:
```css
--color-primary: [color_primario del profesional]
--color-accent: [color_acento del profesional]
```

### Otros campos visuales
- Foto/logo del negocio (avatar circular)
- Nombre del negocio (heading principal)
- Descripción corta (subtítulo, max 120 chars)

---

## 📱 Página pública `/[slug]`

Esta es la página que comparte el profesional con sus clientes.

### Estructura visual
```
┌─────────────────────────────────┐
│  [Logo]  Nombre del negocio     │
│          Descripción corta      │
├─────────────────────────────────┤
│  [Tab: Tipo 1] [Tab: Tipo 2]    │  ← si hay más de un tipo
├─────────────────────────────────┤
│  LUN 19  MAR 20  MIE 21  ...    │  ← carrusel de días (14 días)
├─────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐    │
│  │ 9:00 │ │ 9:30 │ │10:00 │    │  ← slots disponibles
│  └──────┘ └──────┘ └──────┘    │
│  ┌──────┐                       │
│  │10:30 │                       │
│  └──────┘                       │
└─────────────────────────────────┘
```

### Flujo de solicitud
1. Usuario elige tipo de turno (tab)
2. Usuario elige día (carrusel)
3. Usuario toca un slot → el card se oscurece con overlay negro ~72% opacidad, aparece ícono de WhatsApp verde + texto "reservar" con animación spring
4. Usuario toca el overlay "reservar" → se abre `wa.me` del profesional con mensaje pre-armado
5. **No hay formulario, no hay campos, no hay sheet.** Cero fricción.

El número de WhatsApp del usuario se captura automáticamente via webhook de Meta cuando el mensaje llega al profesional (`from` del payload = número real verificado).

El slot se marca optimistamente como pendiente en el frontend al tocar "reservar". El estado real se actualiza cuando llega el webhook.

**Si el usuario toca un slot ya seleccionado, se deselecciona** — permite cambiar de opinión sin recargar.

### Mensaje pre-armado al profesional
```
Hola {nombreNegocio}! 👋 Quiero reservar el siguiente turno:

📅 *{diaNombre} {fecha}* a las *{hora}*
✂️ *{tipoTurno} ({duracion} min)*

_Enviado desde vacans.xyz_
```

### Server-side rendering
La página `/[slug]` es **SSR** (no estática) para mostrar slots siempre actualizados.
Usar `cache: 'no-store'` o revalidar cada 60 segundos.

---

## 🖥 Dashboard del profesional

### `/dashboard` — Home
- Resumen del día: turnos pendientes, confirmados, rechazados
- Próximos 3 turnos confirmados
- Acceso rápido al link de la página pública con botón "Copiar link"

### `/dashboard/turnos` — Gestión de turnos
- Lista de solicitudes ordenadas por fecha
- Filtros: estado (pendiente/confirmado/rechazado), fecha, tipo
- Cada card muestra: nombre cliente, tipo, fecha/hora, estado
- Acciones: Confirmar ✅ / Rechazar ❌
- Al confirmar/rechazar, si el cliente dejó email → enviar notificación automática

### `/dashboard/configuracion/tipos` — Tipos de turno
- Listado de tipos activos (max 2 en free)
- Form: nombre, duración, descripción, precio_display, color badge
- Banner de upgrade si intenta agregar un tercero en free

### `/dashboard/configuracion/disponibilidad` — Horarios
- Toggle por día de semana (Lun–Dom)
- Para cada día activo: hora inicio / hora fin
- Preview: "Generás X slots por día para [Tipo 1] y Y slots para [Tipo 2]"

### `/dashboard/configuracion/apariencia` — Look & Feel
- Selector de color primario y acento (color picker + presets)
- Preview en vivo de cómo quedará la página pública
- Upload de foto/logo

### `/dashboard/configuracion/perfil` — Datos del negocio
- Nombre del negocio, descripción, teléfono WhatsApp, email, slug

---

## 🔐 Autenticación

- Supabase Auth con **email + password clásico**
- Registro: email, password, nombre del negocio, slug deseado, teléfono WhatsApp
- Login: email + password
- Middleware Next.js para proteger rutas `/dashboard/*`
- Redirect a `/dashboard` si ya está logueado y va a `/login`

---

## 💳 Suscripción (simplificado para V1)

- **Free**: 2 tipos de turno, todas las demás funciones completas
- **Premium**: tipos de turno ilimitados + (futuro) analytics + personalización avanzada
- El plan se guarda en `profesionales.plan`
- Para V1: el upgrade es manual (contacto directo), sin integración de pagos todavía

---

## 📧 Emails (Resend)

Usar el dominio `vacans.xyz` para enviar desde `notificaciones@vacans.xyz`.

| Evento | Destinatario | Asunto |
|--------|-------------|--------|
| Nueva solicitud | Profesional | 📅 Nueva solicitud — [Tipo] el [Fecha] |
| Turno confirmado | Cliente (si dejó email) | ✅ Tu turno fue confirmado |
| Turno rechazado | Cliente (si dejó email) | ❌ Turno no disponible — [Negocio] |
| Bienvenida | Profesional (al registrarse) | 👋 Bienvenido a Vacans |

---

## 🚀 Variables de entorno

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Resend
RESEND_API_KEY=

# Meta WhatsApp Cloud API
WA_ACCESS_TOKEN=              # token permanente del system user
WA_PHONE_NUMBER_ID=           # ID del número de negocio
WA_BUSINESS_ACCOUNT_ID=       # ID de la WhatsApp Business Account
WA_WEBHOOK_VERIFY_TOKEN=      # string secreto para verificar el webhook
WA_TEMPLATE_NUEVA_SOLICITUD=  # nombre del template: nueva_solicitud_turno

# Anthropic (V2 - bot inteligente)
ANTHROPIC_API_KEY=

# App
NEXT_PUBLIC_APP_URL=https://vacans.xyz
```

---

## 📋 Orden de implementación sugerido

1. Setup de Supabase: migrations SQL (todas las tablas + RLS)
2. Auth: registro y login con email/password
3. Dashboard básico: configuración de perfil, tipos de turno, disponibilidad
4. Lógica de generación de slots (`lib/slots.ts`)
5. Página pública `/[slug]` con grilla y modal de solicitud
6. API route `/api/solicitudes`:
   - Inserta solicitud en Supabase
   - Envía email via Resend (`lib/resend.ts`)
   - Envía WhatsApp al profesional via Meta API (`lib/whatsapp-meta.ts`)
7. Webhook entrante `/api/whatsapp/webhook` (GET verificación + POST handler)
8. Dashboard de gestión de turnos (confirmar/rechazar + notificación al cliente)
9. Personalización de apariencia con preview en vivo
10. Landing page de Vacans (`/`)

---

## 🧪 Consideraciones técnicas

- **Zona horaria**: guardar siempre en UTC en Supabase, mostrar en timezone del navegador del profesional. Guardar `timezone` en `profesionales` para consistencia.
- **Slug validation**: solo letras minúsculas, números y guiones. Mínimo 3 caracteres.
- **Concurrencia**: dos usuarios pueden solicitar el mismo slot simultáneamente — está permitido en V1 (el profesional decide). No hay lock.
- **Mobile first**: la página pública se usa principalmente desde el celular del cliente.
