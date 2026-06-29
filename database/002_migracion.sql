-- =============================================================================
-- MIGRACIÓN 002: Columna diagnóstico + RLS fix
-- Ejecutar en Supabase SQL Editor
-- =============================================================================

-- 1. Agregar columna diagnóstico a vehicles
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS diagnostico TEXT NOT NULL DEFAULT '';

-- 2. Agregar columna costo_actual (financiero)
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS costo TEXT NOT NULL DEFAULT '';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS costo_total TEXT NOT NULL DEFAULT '';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS presupuesto TEXT NOT NULL DEFAULT '';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS proveedor TEXT NOT NULL DEFAULT '';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS fec_gest TEXT NOT NULL DEFAULT '';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS orden_compra TEXT NOT NULL DEFAULT '';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS factura TEXT NOT NULL DEFAULT '';

-- =============================================================================
-- 3. CORREGIR RLS: user_metadata en vez de 'role'
-- =============================================================================

DROP POLICY IF EXISTS "Admins pueden crear vehículos" ON vehicles;
DROP POLICY IF EXISTS "Admins pueden actualizar vehículos" ON vehicles;
DROP POLICY IF EXISTS "Mecánicos pueden solicitar repuestos" ON part_requests;
DROP POLICY IF EXISTS "Admins pueden actualizar repuestos" ON part_requests;
DROP POLICY IF EXISTS "Auditores y admins pueden crear auditorías" ON audits;
DROP POLICY IF EXISTS "Escritura cronograma" ON schedules;
DROP POLICY IF EXISTS "Actualización cronograma" ON schedules;

CREATE POLICY "Admins pueden crear vehículos"
  ON vehicles FOR INSERT TO authenticated WITH CHECK (
    auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
  );

CREATE POLICY "Admins pueden actualizar vehículos"
  ON vehicles FOR UPDATE TO authenticated USING (
    auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
  );

CREATE POLICY "Mecánicos pueden solicitar repuestos"
  ON part_requests FOR INSERT TO authenticated WITH CHECK (
    auth.jwt() -> 'user_metadata' ->> 'role' IN ('admin', 'mechanic')
  );

CREATE POLICY "Admins pueden actualizar repuestos"
  ON part_requests FOR UPDATE TO authenticated USING (
    auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
  );

CREATE POLICY "Auditores y admins pueden crear auditorías"
  ON audits FOR INSERT TO authenticated WITH CHECK (
    auth.jwt() -> 'user_metadata' ->> 'role' IN ('admin', 'auditor')
  );

CREATE POLICY "Escritura cronograma"
  ON schedules FOR INSERT TO authenticated WITH CHECK (
    auth.jwt() -> 'user_metadata' ->> 'role' IN ('admin', 'auditor')
  );

CREATE POLICY "Actualización cronograma"
  ON schedules FOR UPDATE TO authenticated USING (
    auth.jwt() -> 'user_metadata' ->> 'role' IN ('admin', 'auditor')
  );
