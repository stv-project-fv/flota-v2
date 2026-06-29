-- =============================================================================
-- GEOOBRAS FLOTA V2 - Schema Inicial
-- Motor: PostgreSQL 15+ (Supabase)
-- =============================================================================

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. VEHÍCULOS
-- =============================================================================
CREATE TABLE vehicles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code        TEXT UNIQUE NOT NULL,              -- ID legible: "UNIDAD-01"
  type        TEXT NOT NULL DEFAULT '',           -- Tipo: Camión, Retroexcavadora, etc.
  brand       TEXT NOT NULL DEFAULT '',
  model       TEXT NOT NULL DEFAULT '',
  plate       TEXT NOT NULL DEFAULT '',           -- Dominio/Patente
  year        INTEGER DEFAULT 0,
  status      TEXT NOT NULL DEFAULT 'ACTIVO',     -- ACTIVO, INACTIVO, REPARACION
  area        TEXT NOT NULL DEFAULT '',           -- Área asignada
  photo_url   TEXT NOT NULL DEFAULT '',
  nfc_key     TEXT UNIQUE NOT NULL DEFAULT '',    -- Código de la llave NFC

  -- Campos privados (requieren rol admin)
  engine      TEXT NOT NULL DEFAULT '',
  chassis     TEXT NOT NULL DEFAULT '',
  patrimony   TEXT NOT NULL DEFAULT '',
  driver      TEXT NOT NULL DEFAULT '',
  file_number TEXT NOT NULL DEFAULT '',
  dni         TEXT NOT NULL DEFAULT '',

  -- Campos dinámicos (diagnóstico y financiero)
  diagnostico TEXT NOT NULL DEFAULT '',
  costo       TEXT NOT NULL DEFAULT '',
  costo_total TEXT NOT NULL DEFAULT '',
  presupuesto TEXT NOT NULL DEFAULT '',
  proveedor   TEXT NOT NULL DEFAULT '',
  fec_gest    TEXT NOT NULL DEFAULT '',
  orden_compra TEXT NOT NULL DEFAULT '',
  factura     TEXT NOT NULL DEFAULT '',

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vehicles_code ON vehicles(code);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_nfc ON vehicles(nfc_key);

-- =============================================================================
-- 2. MOVIMIENTOS (Entrada/Salida)
-- =============================================================================
CREATE TABLE movements (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id  UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  action      TEXT NOT NULL,                     -- ENTRADA, SALIDA, NOVEDAD, INACTIVO
  motive      TEXT NOT NULL DEFAULT '',
  recorded_by UUID REFERENCES auth.users(id),

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_movements_vehicle ON movements(vehicle_id);
CREATE INDEX idx_movements_date ON movements(created_at DESC);
CREATE INDEX idx_movements_vehicle_date ON movements(vehicle_id, created_at DESC);

-- =============================================================================
-- 3. COMBUSTIBLE
-- =============================================================================
CREATE TABLE fuel_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id  UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  fuel_type   TEXT NOT NULL DEFAULT 'DIESEL (GASOIL)',  -- DIESEL, NAFTA, GNC
  liters      DECIMAL(10,2) NOT NULL DEFAULT 0,
  odometer    INTEGER NOT NULL DEFAULT 0,
  recorded_by UUID REFERENCES auth.users(id),

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fuel_vehicle ON fuel_logs(vehicle_id);
CREATE INDEX idx_fuel_date ON fuel_logs(created_at DESC);

-- =============================================================================
-- 4. FLUIDOS / LUBRICANTES
-- =============================================================================
CREATE TABLE fluids_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id  UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  category    TEXT NOT NULL,   -- ACEITE_MOTOR, TRANSMISION, HIDRAULICO, REFRIGERANTE, ADITIVOS_LIQ, ADITIVOS_SOL
  subtype     TEXT NOT NULL,   -- 15W40, ISO68, etc.
  quantity    DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit        TEXT NOT NULL DEFAULT 'Litros',
  recorded_by UUID REFERENCES auth.users(id),

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fluids_vehicle ON fluids_logs(vehicle_id);

-- =============================================================================
-- 5. MANTENIMIENTO
-- =============================================================================
CREATE TABLE maintenance_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id  UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,   -- INTERNA (reparación en taller), EXTERNA (derivado), LOGISTICA
  detail      TEXT NOT NULL DEFAULT '',
  recorded_by UUID REFERENCES auth.users(id),

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_maint_vehicle ON maintenance_logs(vehicle_id);
CREATE INDEX idx_maint_date ON maintenance_logs(created_at DESC);

-- =============================================================================
-- 6. SOLICITUDES DE REPUESTOS
-- =============================================================================
CREATE TABLE part_requests (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id    UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'PENDIENTE',  -- PENDIENTE, PEDIDO, DISPONIBLE, CERRADO
  note          TEXT NOT NULL DEFAULT '',
  admin_note    TEXT NOT NULL DEFAULT '',
  requested_by  UUID REFERENCES auth.users(id),

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_parts_vehicle ON part_requests(vehicle_id);
CREATE INDEX idx_parts_status ON part_requests(status);

-- =============================================================================
-- 7. AUDITORÍAS / CHECKLIST
-- =============================================================================
CREATE TABLE audits (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id      UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  type            TEXT NOT NULL DEFAULT 'DIARIA / PRE-VIAJE',  -- DIARIA, PREVENTIVO
  checklist_data  JSONB NOT NULL DEFAULT '{}',   -- Resultados del checklist estructurados
  observations    TEXT NOT NULL DEFAULT '',
  recorded_by     UUID REFERENCES auth.users(id),

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audits_vehicle ON audits(vehicle_id);
CREATE INDEX idx_audits_date ON audits(created_at DESC);

-- =============================================================================
-- 8. CRONOGRAMA PREVENTIVO
-- =============================================================================
CREATE TABLE schedules (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id        UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  scheduled_date    DATE NOT NULL,
  maintenance_type  TEXT NOT NULL,   -- CAMBIO ACEITE, ROTACIÓN NEUMÁTICOS, etc.
  status            TEXT NOT NULL DEFAULT 'PENDIENTE',   -- PENDIENTE, REALIZADO, VENCIDO
  notes             TEXT NOT NULL DEFAULT '',
  created_by        UUID REFERENCES auth.users(id),

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_schedules_vehicle ON schedules(vehicle_id);
CREATE INDEX idx_schedules_date ON schedules(scheduled_date);
CREATE INDEX idx_schedules_status ON schedules(status);

-- =============================================================================
-- TRIGGER: updated_at automático
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_vehicles_updated_at
  BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_part_requests_updated_at
  BEFORE UPDATE ON part_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_schedules_updated_at
  BEFORE UPDATE ON schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY (Supabase)
-- =============================================================================
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fluids_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE part_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- Políticas: todos los autenticados pueden leer vehículos
CREATE POLICY "Todos pueden leer vehículos"
  ON vehicles FOR SELECT TO authenticated USING (true);

-- Solo admins pueden escribir vehículos
CREATE POLICY "Admins pueden crear vehículos"
  ON vehicles FOR INSERT TO authenticated WITH CHECK (
    auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
  );

CREATE POLICY "Admins pueden actualizar vehículos"
  ON vehicles FOR UPDATE TO authenticated USING (
    auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
  );

-- Movimientos: cualquier autenticado puede insertar
CREATE POLICY "Autenticados pueden insertar movimientos"
  ON movements FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Autenticados pueden leer movimientos"
  ON movements FOR SELECT TO authenticated USING (true);

-- Similar para fuel_logs, fluids_logs, maintenance_logs
CREATE POLICY "Autenticados pueden insertar combustible"
  ON fuel_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Autenticados pueden leer combustible"
  ON fuel_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Autenticados pueden insertar fluidos"
  ON fluids_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Autenticados pueden leer fluidos"
  ON fluids_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Autenticados pueden insertar mantenimiento"
  ON maintenance_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Autenticados pueden leer mantenimiento"
  ON maintenance_logs FOR SELECT TO authenticated USING (true);

-- Repuestos: admins y mecánicos pueden manejar
CREATE POLICY "Lectura repuestos"
  ON part_requests FOR SELECT TO authenticated USING (true);

CREATE POLICY "Mecánicos pueden solicitar repuestos"
  ON part_requests FOR INSERT TO authenticated WITH CHECK (
    auth.jwt() -> 'user_metadata' ->> 'role' IN ('admin', 'mechanic')
  );

CREATE POLICY "Admins pueden actualizar repuestos"
  ON part_requests FOR UPDATE TO authenticated USING (
    auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
  );

-- Auditorías: auditores y admins
CREATE POLICY "Lectura auditorías"
  ON audits FOR SELECT TO authenticated USING (true);

CREATE POLICY "Auditores y admins pueden crear auditorías"
  ON audits FOR INSERT TO authenticated WITH CHECK (
    auth.jwt() -> 'user_metadata' ->> 'role' IN ('admin', 'auditor')
  );

-- Cronograma: todos leen, admins y auditores escriben
CREATE POLICY "Lectura cronograma"
  ON schedules FOR SELECT TO authenticated USING (true);

CREATE POLICY "Escritura cronograma"
  ON schedules FOR INSERT TO authenticated WITH CHECK (
    auth.jwt() -> 'user_metadata' ->> 'role' IN ('admin', 'auditor')
  );

CREATE POLICY "Actualización cronograma"
  ON schedules FOR UPDATE TO authenticated USING (
    auth.jwt() -> 'user_metadata' ->> 'role' IN ('admin', 'auditor')
  );
