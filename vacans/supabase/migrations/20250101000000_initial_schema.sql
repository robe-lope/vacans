-- Vacans — Schema inicial
-- Ejecutar en: Supabase Dashboard > SQL Editor

-- ============================================================
-- TABLAS
-- ============================================================

CREATE TABLE IF NOT EXISTS profesionales (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  slug            text UNIQUE NOT NULL,
  nombre_negocio  text NOT NULL,
  descripcion     text,
  telefono_wa     text NOT NULL,
  email_contacto  text NOT NULL,
  foto_url        text,
  color_primario  text NOT NULL DEFAULT '#6366f1',
  color_acento    text NOT NULL DEFAULT '#f59e0b',
  timezone        text NOT NULL DEFAULT 'America/Argentina/Buenos_Aires',
  plan            text NOT NULL DEFAULT 'free',
  activo          boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT plan_valid       CHECK (plan IN ('free', 'premium')),
  CONSTRAINT slug_min_length  CHECK (length(slug) >= 3),
  -- solo minúsculas, números y guiones; no puede empezar ni terminar con guión
  CONSTRAINT slug_format      CHECK (slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$')
);

CREATE TABLE IF NOT EXISTS tipos_turno (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profesional_id  uuid NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE,
  nombre          text NOT NULL,
  duracion_mins   integer NOT NULL,
  descripcion     text,
  precio_display  text,
  color           text,
  activo          boolean NOT NULL DEFAULT true,
  orden           integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT duracion_positiva CHECK (duracion_mins > 0)
);

CREATE TABLE IF NOT EXISTS disponibilidad (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profesional_id  uuid NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE,
  dia_semana      integer NOT NULL,
  hora_inicio     time NOT NULL,
  hora_fin        time NOT NULL,
  activo          boolean NOT NULL DEFAULT true,

  CONSTRAINT dia_semana_valid   CHECK (dia_semana BETWEEN 0 AND 6),
  CONSTRAINT hora_fin_gt_inicio CHECK (hora_fin > hora_inicio)
);

CREATE TABLE IF NOT EXISTS slot_overrides (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profesional_id  uuid NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE,
  fecha           date NOT NULL,
  hora_inicio     time NOT NULL,
  tipo_turno_id   uuid REFERENCES tipos_turno(id) ON DELETE SET NULL,
  tipo            text NOT NULL,
  motivo          text,
  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT tipo_valid CHECK (tipo IN ('agregar', 'quitar'))
);

CREATE TABLE IF NOT EXISTS solicitudes (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profesional_id   uuid NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE,
  tipo_turno_id    uuid REFERENCES tipos_turno(id) ON DELETE SET NULL,
  fecha            date NOT NULL,
  hora_inicio      time NOT NULL,
  nombre_cliente   text NOT NULL,
  telefono_cliente text,
  email_cliente    text,
  estado           text NOT NULL DEFAULT 'pendiente',
  notas            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT estado_valid CHECK (estado IN ('pendiente', 'confirmado', 'rechazado'))
);

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profesionales_slug    ON profesionales(slug);
CREATE INDEX IF NOT EXISTS idx_profesionales_user_id ON profesionales(user_id);
CREATE INDEX IF NOT EXISTS idx_tipos_turno_prof      ON tipos_turno(profesional_id) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_disponibilidad_prof   ON disponibilidad(profesional_id) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_slot_overrides_fecha  ON slot_overrides(profesional_id, fecha);
CREATE INDEX IF NOT EXISTS idx_solicitudes_prof      ON solicitudes(profesional_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_fecha     ON solicitudes(profesional_id, fecha);

-- ============================================================
-- TRIGGERS: updated_at automático
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_profesionales_updated_at
  BEFORE UPDATE ON profesionales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_solicitudes_updated_at
  BEFORE UPDATE ON solicitudes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profesionales  ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_turno    ENABLE ROW LEVEL SECURITY;
ALTER TABLE disponibilidad ENABLE ROW LEVEL SECURITY;
ALTER TABLE slot_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitudes    ENABLE ROW LEVEL SECURITY;

-- ---- profesionales ----
-- SELECT público: página /[slug] lo necesita sin auth
CREATE POLICY "profesionales_select_public"
  ON profesionales FOR SELECT
  USING (activo = true);

-- El owner también puede ver su propio registro (aunque esté inactivo)
CREATE POLICY "profesionales_select_own"
  ON profesionales FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "profesionales_insert_own"
  ON profesionales FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profesionales_update_own"
  ON profesionales FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profesionales_delete_own"
  ON profesionales FOR DELETE
  USING (auth.uid() = user_id);

-- ---- tipos_turno ----
CREATE POLICY "tipos_turno_select_public"
  ON tipos_turno FOR SELECT
  USING (true);

CREATE POLICY "tipos_turno_insert_own"
  ON tipos_turno FOR INSERT
  WITH CHECK (
    auth.uid() = (SELECT user_id FROM profesionales WHERE id = profesional_id)
  );

CREATE POLICY "tipos_turno_update_own"
  ON tipos_turno FOR UPDATE
  USING (
    auth.uid() = (SELECT user_id FROM profesionales WHERE id = profesional_id)
  );

CREATE POLICY "tipos_turno_delete_own"
  ON tipos_turno FOR DELETE
  USING (
    auth.uid() = (SELECT user_id FROM profesionales WHERE id = profesional_id)
  );

-- ---- disponibilidad ----
CREATE POLICY "disponibilidad_select_public"
  ON disponibilidad FOR SELECT
  USING (true);

CREATE POLICY "disponibilidad_insert_own"
  ON disponibilidad FOR INSERT
  WITH CHECK (
    auth.uid() = (SELECT user_id FROM profesionales WHERE id = profesional_id)
  );

CREATE POLICY "disponibilidad_update_own"
  ON disponibilidad FOR UPDATE
  USING (
    auth.uid() = (SELECT user_id FROM profesionales WHERE id = profesional_id)
  );

CREATE POLICY "disponibilidad_delete_own"
  ON disponibilidad FOR DELETE
  USING (
    auth.uid() = (SELECT user_id FROM profesionales WHERE id = profesional_id)
  );

-- ---- slot_overrides ----
CREATE POLICY "slot_overrides_select_public"
  ON slot_overrides FOR SELECT
  USING (true);

CREATE POLICY "slot_overrides_insert_own"
  ON slot_overrides FOR INSERT
  WITH CHECK (
    auth.uid() = (SELECT user_id FROM profesionales WHERE id = profesional_id)
  );

CREATE POLICY "slot_overrides_update_own"
  ON slot_overrides FOR UPDATE
  USING (
    auth.uid() = (SELECT user_id FROM profesionales WHERE id = profesional_id)
  );

CREATE POLICY "slot_overrides_delete_own"
  ON slot_overrides FOR DELETE
  USING (
    auth.uid() = (SELECT user_id FROM profesionales WHERE id = profesional_id)
  );

-- ---- solicitudes ----
-- INSERT público: cualquier visitante puede crear una solicitud
CREATE POLICY "solicitudes_insert_public"
  ON solicitudes FOR INSERT
  WITH CHECK (true);

-- SELECT/UPDATE solo el owner del profesional
CREATE POLICY "solicitudes_select_own"
  ON solicitudes FOR SELECT
  USING (
    auth.uid() = (SELECT user_id FROM profesionales WHERE id = profesional_id)
  );

CREATE POLICY "solicitudes_update_own"
  ON solicitudes FOR UPDATE
  USING (
    auth.uid() = (SELECT user_id FROM profesionales WHERE id = profesional_id)
  );
