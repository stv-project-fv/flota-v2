# PLAN COMPLETO — GI Flota v2.0

*Documento de especificación para replicación por IA autónoma.*
*Duración estimada: 8 semanas | Costo: $0/mes | Stack: React + Supabase + FastAPI + PWA*

---

## 0. FUNDAMENTO TÉCNICO

### Stack final

```
Frontend:   React 19 + Vite + TailwindCSS 4 + PWA (Service Worker + IndexedDB)
Backend:    FastAPI + SQLAlchemy async + Pydantic
Database:   PostgreSQL (Supabase free tier)
Auth:       Supabase Auth (magic links + JWT + RLS)
Storage:    Supabase Storage (fotos, PDFs)
Realtime:   Supabase Realtime (WebSocket)
Offline:    Dexie.js (IndexedDB) + cola de sincronización
Deploy:     Cloudflare Pages (frontend) + Render (backend)
CI/CD:      GitHub Actions
```

### Estructura final de directorios

```
flota-v2/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── all_models.py         (8 modelos SQLAlchemy)
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   └── all_schemas.py        (Pydantic request/response)
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── vehicles.py
│   │   │   ├── movements.py
│   │   │   ├── fuel.py
│   │   │   ├── fluids.py
│   │   │   ├── maintenance.py
│   │   │   ├── parts.py
│   │   │   ├── audits.py
│   │   │   ├── schedules.py
│   │   │   ├── qr.py
│   │   │   └── reports.py
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── sync_service.py
│   │       ├── qr_service.py
│   │       └── report_service.py
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── public/
│   │   ├── manifest.json
│   │   ├── sw.js
│   │   ├── icon-192.png
│   │   ├── icon-512.png
│   │   └── favicon.png
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   ├── config/
│   │   │   └── constants.js
│   │   ├── store/
│   │   │   └── useStore.js
│   │   ├── services/
│   │   │   ├── supabase.js
│   │   │   └── offline.js
│   │   ├── hooks/
│   │   │   ├── useOnlineStatus.js
│   │   │   └── useSync.js
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── FleetPage.jsx
│   │   │   ├── VehicleDetailPage.jsx
│   │   │   ├── KioskPage.jsx
│   │   │   ├── WorkshopPage.jsx
│   │   │   ├── AuditPage.jsx
│   │   │   └── ReportsPage.jsx
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── AppLayout.jsx
│   │   │   │   ├── Navbar.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   └── OfflineBanner.jsx
│   │   │   ├── vehicles/
│   │   │   │   ├── VehicleTable.jsx
│   │   │   │   ├── VehicleCard.jsx
│   │   │   │   └── VehicleForm.jsx
│   │   │   ├── kiosk/
│   │   │   │   ├── NfcReader.jsx
│   │   │   │   └── QrScanner.jsx
│   │   │   ├── workshop/
│   │   │   │   ├── MaintenancePanel.jsx
│   │   │   │   └── PartKanban.jsx
│   │   │   ├── audit/
│   │   │   │   └── ChecklistBuilder.jsx
│   │   │   ├── dashboard/
│   │   │   │   └── StatsGrid.jsx
│   │   │   └── ui/
│   │   │       ├── Button.jsx
│   │   │       ├── Badge.jsx
│   │   │       ├── Modal.jsx
│   │   │       └── Toast.jsx
│   │   └── lib/
│   │       └── utils.js
│   ├── index.html
│   ├── vite.config.js
│   ├── postcss.config.js
│   └── package.json
├── database/
│   └── 001_schema.sql
├── scripts/
│   └── migrate_all.py
├── .github/
│   └── workflows/
│       └── deploy.yml
├── .gitignore
├── README.md
└── PLAN.md
```

---

## FASE 1 — INFRAESTRUCTURA Y DATOS (Semana 1)

### Paso 1.1: Crear proyecto Supabase

```
1. Ir a https://supabase.com → Sign up (gratis)
2. New project → Nombre: "flota-varela"
3. Database Password: guardar en gestor de contraseñas
4. Region: South America (São Paulo) - sa-east-1
5. Esperar a que termine el provisioning (~2 min)
6. Ir a Project Settings → API y copiar:
   - Project URL → guardar como SUPABASE_URL
   - anon public key → guardar como SUPABASE_ANON_KEY
   - service_role key → guardar como SUPABASE_SERVICE_KEY
7. Ir a Project Settings → Auth y copiar JWT Secret
```

### Paso 1.2: Ejecutar schema SQL en Supabase

```
1. En Supabase, ir a SQL Editor
2. New query → pegar el contenido de database/001_schema.sql
3. Run (Ctrl+Enter)
4. Verificar en Table Editor que aparecen 8 tablas vacías:
   vehicles, movements, fuel_logs, fluids_logs,
   maintenance_logs, part_requests, audits, schedules
```

**Contenido de `database/001_schema.sql`:**

```sql
-- =============================================================================
-- GI FLOTA V2 - Schema Inicial
-- Motor: PostgreSQL 15+ (Supabase)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. VEHÍCULOS
CREATE TABLE vehicles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code        TEXT UNIQUE NOT NULL,
  type        TEXT NOT NULL DEFAULT '',
  brand       TEXT NOT NULL DEFAULT '',
  model       TEXT NOT NULL DEFAULT '',
  plate       TEXT NOT NULL DEFAULT '',
  year        INTEGER DEFAULT 0,
  status      TEXT NOT NULL DEFAULT 'ACTIVO',
  area        TEXT NOT NULL DEFAULT '',
  photo_url   TEXT NOT NULL DEFAULT '',
  nfc_key     TEXT UNIQUE NOT NULL DEFAULT '',
  engine      TEXT NOT NULL DEFAULT '',
  chassis     TEXT NOT NULL DEFAULT '',
  patrimony   TEXT NOT NULL DEFAULT '',
  driver      TEXT NOT NULL DEFAULT '',
  file_number TEXT NOT NULL DEFAULT '',
  dni         TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vehicles_code ON vehicles(code);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_nfc ON vehicles(nfc_key);

-- 2. MOVIMIENTOS
CREATE TABLE movements (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id  UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  action      TEXT NOT NULL,
  motive      TEXT NOT NULL DEFAULT '',
  recorded_by UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_movements_vehicle ON movements(vehicle_id);
CREATE INDEX idx_movements_date ON movements(created_at DESC);
CREATE INDEX idx_movements_vehicle_date ON movements(vehicle_id, created_at DESC);

-- 3. COMBUSTIBLE
CREATE TABLE fuel_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id  UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  fuel_type   TEXT NOT NULL DEFAULT 'DIESEL (GASOIL)',
  liters      DECIMAL(10,2) NOT NULL DEFAULT 0,
  odometer    INTEGER NOT NULL DEFAULT 0,
  recorded_by UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fuel_vehicle ON fuel_logs(vehicle_id);
CREATE INDEX idx_fuel_date ON fuel_logs(created_at DESC);

-- 4. FLUIDOS / LUBRICANTES
CREATE TABLE fluids_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id  UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  category    TEXT NOT NULL,
  subtype     TEXT NOT NULL,
  quantity    DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit        TEXT NOT NULL DEFAULT 'Litros',
  recorded_by UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fluids_vehicle ON fluids_logs(vehicle_id);

-- 5. MANTENIMIENTO
CREATE TABLE maintenance_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id  UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  detail      TEXT NOT NULL DEFAULT '',
  recorded_by UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_maint_vehicle ON maintenance_logs(vehicle_id);
CREATE INDEX idx_maint_date ON maintenance_logs(created_at DESC);

-- 6. SOLICITUDES DE REPUESTOS
CREATE TABLE part_requests (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id    UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'PENDIENTE',
  note          TEXT NOT NULL DEFAULT '',
  admin_note    TEXT NOT NULL DEFAULT '',
  requested_by  UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_parts_vehicle ON part_requests(vehicle_id);
CREATE INDEX idx_parts_status ON part_requests(status);

-- 7. AUDITORÍAS / CHECKLIST
CREATE TABLE audits (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id      UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  type            TEXT NOT NULL DEFAULT 'DIARIA / PRE-VIAJE',
  checklist_data  JSONB NOT NULL DEFAULT '{}',
  observations    TEXT NOT NULL DEFAULT '',
  recorded_by     UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audits_vehicle ON audits(vehicle_id);
CREATE INDEX idx_audits_date ON audits(created_at DESC);

-- 8. CRONOGRAMA PREVENTIVO
CREATE TABLE schedules (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id        UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  scheduled_date    DATE NOT NULL,
  maintenance_type  TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'PENDIENTE',
  notes             TEXT NOT NULL DEFAULT '',
  created_by        UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_schedules_vehicle ON schedules(vehicle_id);
CREATE INDEX idx_schedules_date ON schedules(scheduled_date);
CREATE INDEX idx_schedules_status ON schedules(status);

-- Trigger: updated_at automático
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

-- Row Level Security
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fluids_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE part_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad por rol
CREATE POLICY "Todos pueden leer vehículos"
  ON vehicles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins pueden crear vehículos"
  ON vehicles FOR INSERT TO authenticated WITH CHECK (
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Admins pueden actualizar vehículos"
  ON vehicles FOR UPDATE TO authenticated USING (
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Autenticados pueden insertar movimientos"
  ON movements FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Autenticados pueden leer movimientos"
  ON movements FOR SELECT TO authenticated USING (true);

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

CREATE POLICY "Lectura repuestos"
  ON part_requests FOR SELECT TO authenticated USING (true);

CREATE POLICY "Mecánicos pueden solicitar repuestos"
  ON part_requests FOR INSERT TO authenticated WITH CHECK (
    auth.jwt() ->> 'role' IN ('admin', 'mechanic')
  );

CREATE POLICY "Admins pueden actualizar repuestos"
  ON part_requests FOR UPDATE TO authenticated USING (
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Lectura auditorías"
  ON audits FOR SELECT TO authenticated USING (true);

CREATE POLICY "Auditores y admins pueden crear auditorías"
  ON audits FOR INSERT TO authenticated WITH CHECK (
    auth.jwt() ->> 'role' IN ('admin', 'auditor')
  );

CREATE POLICY "Lectura cronograma"
  ON schedules FOR SELECT TO authenticated USING (true);

CREATE POLICY "Escritura cronograma"
  ON schedules FOR INSERT TO authenticated WITH CHECK (
    auth.jwt() ->> 'role' IN ('admin', 'auditor')
  );

CREATE POLICY "Actualización cronograma"
  ON schedules FOR UPDATE TO authenticated USING (
    auth.jwt() ->> 'role' IN ('admin', 'auditor')
  );
```

### Paso 1.3: Crear estructura del proyecto

```bash
# Desde la terminal
mkdir -p flota-v2
cd flota-v2

# Backend
mkdir -p backend/app/{models,schemas,routers,services}
mkdir -p database scripts

# Frontend
mkdir -p frontend/{public,src/{config,store,services,hooks,pages,components/{layout,vehicles,kiosk,workshop,audit,dashboard,ui},lib}}
```

### Paso 1.4: Configurar variables de entorno

**Archivo `backend/.env`:**

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIs...
JWT_SECRET=xxxxxxxxxxxxxxxxxxxx
SECRET_KEY=generar-con: python -c "import secrets; print(secrets.token_hex(32))"
ENVIRONMENT=development

LOGO_URL=https://i.ibb.co/chpfBP5X/Logo1.png
QR_LOGO_URL=https://i.ibb.co/bhRNpsL/Logo-QR.png
BANNER_URL=https://i.ibb.co/Fq6mSJgm/Secretar-a-de-Obras-Servicios-P-blicos-Ambiente-y-Planificaci-n-Urbana.png

COLOR_PRINCIPAL=#009B77
COLOR_SECUNDARIO=#DAA520
```

**Archivo `frontend/.env`:**

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
VITE_API_URL=http://localhost:8000
```

### Paso 1.5: Crear archivos base del backend

**Archivo `backend/requirements.txt`:**

```
fastapi==0.115.0
uvicorn[standard]==0.30.0
sqlalchemy[asyncio]==2.0.35
asyncpg==0.30.0
psycopg2-binary==2.9.9
pydantic==2.9.0
pydantic-settings==2.5.0
python-dotenv==1.0.1
supabase==2.5.0
Pillow==11.0.0
qrcode[pil]==8.0
python-multipart==0.0.12
httpx==0.28.0
reportlab==4.2.0
email-validator==2.2.0
alembic==1.13.0
```

**Archivo `backend/app/__init__.py`:** vacío

**Archivo `backend/app/models/__init__.py`:** vacío

**Archivo `backend/app/schemas/__init__.py`:** vacío

**Archivo `backend/app/routers/__init__.py`:** vacío

**Archivo `backend/app/services/__init__.py`:** vacío

**Archivo `backend/app/config.py`:**

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_key: str = ""
    jwt_secret: str = ""
    secret_key: str = ""
    environment: str = "development"
    database_url: str = ""

    logo_url: str = ""
    qr_logo_url: str = ""
    banner_url: str = ""
    color_principal: str = "#009B77"
    color_secundario: str = "#DAA520"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
```

**Archivo `backend/app/database.py`:**

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

if settings.database_url:
    DATABASE_URL = settings.database_url
elif settings.supabase_url:
    parts = settings.supabase_url.replace("https://", "").split(".")
    ref = parts[0].split("-")[-1] if "-" in parts[0] else parts[0]
    DATABASE_URL = f"postgresql+asyncpg://postgres:{settings.supabase_service_key}@db.{ref}.supabase.co:5432/postgres"
else:
    DATABASE_URL = "sqlite+aiosqlite:///./test.db"

engine = create_async_engine(DATABASE_URL, echo=False, pool_size=5, max_overflow=10)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()
```

**Archivo `backend/app/main.py`:**

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(
    title="GI Flota v2 API",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok", "version": "2.0.0"}
```

### Paso 1.6: Crear archivos base del frontend

**Archivo `frontend/package.json`:**

```json
{
  "name": "flota-v2-frontend",
  "private": true,
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint ."
  },
  "dependencies": {
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "react-router-dom": "^7.5.0",
    "@supabase/supabase-js": "^2.49.0",
    "zustand": "^5.0.0",
    "dexie": "^4.0.0",
    "tailwindcss": "^4.2.2",
    "@tailwindcss/vite": "^4.2.2",
    "lucide-react": "^1.7.0",
    "framer-motion": "^12.38.0",
    "recharts": "^3.8.0",
    "date-fns": "^4.1.0",
    "html5-qrcode": "^2.3.8",
    "react-hot-toast": "^2.4.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^6.0.0",
    "vite": "^8.0.0",
    "autoprefixer": "^10.4.0",
    "@tailwindcss/postcss": "^4.2.2"
  }
}
```

**Archivo `frontend/vite.config.js`:**

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: { "/api": { target: "http://localhost:8000", changeOrigin: true } },
  },
  build: { outDir: "dist", sourcemap: false },
});
```

**Archivo `frontend/postcss.config.js`:**

```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
    autoprefixer: {},
  },
};
```

**Archivo `frontend/index.html`:**

```html
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#009B77" />
    <meta name="description" content="GI Flota - Gestión de Flota Vehicular" />
    <link rel="manifest" href="/manifest.json" />
    <title>GI Flota</title>
  </head>
  <body class="bg-gray-50 text-gray-900 antialiased">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

**Archivo `frontend/public/manifest.json`:**

```json
{
  "name": "GI Flota",
  "short_name": "Flota",
  "description": "Gestión de Flota Vehicular - Municipalidad de Florencio Varela",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#009B77",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**Archivo `frontend/public/sw.js`:**

```js
const CACHE = "flota-v2-v1";
const ASSETS = ["/", "/index.html", "/manifest.json"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((ks) =>
      Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.url.includes("/api")) return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetchP = fetch(e.request)
        .then((res) => {
          if (res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetchP;
    })
  );
});
```

**Archivo `frontend/src/index.css`:**

```css
@import "tailwindcss";

:root {
  --primary: #009B77;
  --primary-light: #00B894;
  --secondary: #DAA520;
  --danger: #dc3545;
  --success: #28a745;
}
```

**Archivo `frontend/src/config/constants.js`:**

```js
export const COLORS = {
  primary: "#009B77", secondary: "#DAA520",
  danger: "#dc3545", success: "#28a745", warning: "#ffc107",
};

export const VEHICLE_STATUS = {
  ACTIVO: { label: "Activo", color: "#28a745" },
  INACTIVO: { label: "Inactivo", color: "#dc3545" },
  REPARACION: { label: "En Reparación", color: "#ffc107" },
};

export const PART_STATUS = {
  PENDIENTE: { label: "Pendiente", color: "#dc3545" },
  PEDIDO: { label: "Pedido", color: "#DAA520" },
  DISPONIBLE: { label: "Disponible", color: "#28a745" },
  CERRADO: { label: "Cerrado", color: "#6c757d" },
};

export const FLUID_CATEGORIES = {
  ACEITE_MOTOR: { unit: "Litros", opts: ["15W40","10W40","5W30","SAE40","5W40"] },
  TRANSMISION: { unit: "Litros", opts: ["80W90","85W140","75W90","ATF","STOU/UTTO"] },
  HIDRAULICO: { unit: "Litros", opts: ["ISO68","ISO46","ISO32"] },
  REFRIGERANTE: { unit: "Litros", opts: ["Orgánico","Inorgánico","Agua Destilada"] },
  ADITIVOS_LIQ: { unit: "Litros", opts: ["AdBlue","Líquido de Frenos","Límpiaparabrisas"] },
  ADITIVOS_SOL: { unit: "Kilos", opts: ["Grasa de Litio"] },
};

export const FUEL_TYPES = ["DIESEL (GASOIL)", "NAFTA", "GNC"];

export const AUDIT_SECTIONS = [
  { title: "1. EXTERIOR & CHASIS", items: ["Neumáticos (Presión/Desgaste)", "Luces (Giro, Freno, Altas/Bajas)", "Carrocería y Suspensión visible"] },
  { title: "2. INTERIOR CABINA", items: ["Frenos (Prueba de pedal)", "Tablero (Testigos, Combustible)", "Dirección (Juego libre)"] },
  { title: "3. MOTOR (APAGADO)", items: ["Nivel Aceite", "Refrigerante", "Correas y Mangueras", "Fugas visibles"] },
];
```

**Archivo `frontend/src/services/supabase.js`:**

```js
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(url, key);
```

**Archivo `frontend/src/services/offline.js`:**

```js
import Dexie from "dexie";

const db = new Dexie("flota-offline");
db.version(1).stores({
  syncQueue: "++id, table, action, created_at",
  vehiclesCache: "&code",
  movementsCache: "++id, vehicle_code, created_at",
  fuelLogsCache: "++id, vehicle_code, created_at",
  fluidsLogsCache: "++id, vehicle_code, created_at",
  maintenanceLogsCache: "++id, vehicle_code, created_at",
  partRequestsCache: "++id, vehicle_code, status",
  auditsCache: "++id, vehicle_code, created_at",
  schedulesCache: "++id, vehicle_code, scheduled_date",
});

export async function addToSyncQueue(table, action, data) {
  return db.syncQueue.add({ table, action, data, created_at: new Date().toISOString() });
}

export default db;
```

**Archivo `frontend/src/store/useStore.js`:**

```js
import { create } from "zustand";

export const useStore = create((set) => ({
  user: null, session: null,
  vehicles: [], movements: [], fuelLogs: [], fluidsLogs: [],
  maintenanceLogs: [], partRequests: [], audits: [], schedules: [],
  online: navigator.onLine, syncQueue: [],

  setOnline: (v) => set({ online: v }),
  setUser: (u) => set({ user: u }),
  setSession: (s) => set({ session: s }),
  setVehicles: (v) => set({ vehicles: v }),
  addToSyncQueue: (item) => set((s) => ({ syncQueue: [...s.syncQueue, item] })),
  clearSyncQueue: () => set({ syncQueue: [] }),
  reset: () => set({
    user: null, session: null, vehicles: [], movements: [], syncQueue: [],
  }),
}));
```

**Archivo `frontend/src/main.jsx`:**

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js"));
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode><App /></React.StrictMode>
);
```

**Archivo `frontend/src/App.jsx`:** (SCAFFOLD INICIAL)

```jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import FleetPage from "./pages/FleetPage";

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/fleet" element={<FleetPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### Paso 1.7: Migrar datos antiguos

**Archivo `scripts/migrate_all.py`:**

```python
"""
Migración completa: Google Sheets + CSVs → Supabase.
Ejecutar: python scripts/migrate_all.py
Requisito: pip install supabase python-dotenv requests
"""
import os, csv, io
from datetime import datetime
import requests
from dotenv import load_dotenv
from supabase import create_client

load_dotenv("backend/.env")

supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

URL_FLOTA = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSqdZ6I77VKHqDefS3qrzvVw4LofQ4RLGqsSjs6VVns9P6Esu1Jg0eTRyW0UsW9m1UNrj_lG-VBLKxX/pub?gid=0&single=true&output=csv"
OLD_DIR = "../qr-data/qr-data"  # Ajustar según ubicación real

CSV_MAP = {
    "movements": ("historial_actividad.csv", {"ACCION": "action", "MOTIVO": "motive"}),
    "fuel_logs": ("historial_combustible.csv", {"TIPO": "fuel_type", "LITROS": "liters", "KM": "odometer"}),
    "fluids_logs": ("historial_fluidos.csv", {"CAT": "category", "SUBTIPO": "subtype", "CANT": "quantity"}),
    "maintenance_logs": ("historial_mantenimiento.csv", {"TIPO": "type", "DETALLE": "detail"}),
    "part_requests": ("estado_repuestos.csv", {"ESTADO": "status", "NOTA": "note"}),
    "schedules": ("cronograma_preventivo.csv", {"FECHA_PROGRAMADA": "scheduled_date", "TIPO_MANTENIMIENTO": "maintenance_type", "ESTADO": "status"}),
    "audits": ("historial_preventivos.csv", {"TIPO": "type", "DETALLE": "observations"}),
}

# 1. Migrar vehículos
print("Migrando vehículos...")
r = requests.get(URL_FLOTA)
r.encoding = "utf-8"
vehicles = []
for row in csv.DictReader(io.StringIO(r.text)):
    vehicles.append({
        "code": row["ID"].strip(), "type": row["TIPO"].strip(),
        "brand": row["MARCA"].strip(), "model": row["MODELO"].strip(),
        "plate": row["DOMINIO"].strip(),
        "year": int(row["AÑO"]) if row.get("AÑO","").strip().isdigit() else 0,
        "status": row["ESTADO"].strip().upper(), "area": row["AREA"].strip(),
        "photo_url": row["FOTO_URL"].strip(), "nfc_key": row["NFC_KEY"].strip().upper(),
        "engine": row.get("MOTOR","").strip(), "chassis": row.get("CHASIS","").strip(),
        "patrimony": row.get("PATRIMONIO","").strip(), "driver": row.get("CHOFER","").strip(),
        "dni": row.get("DNI","").strip(),
    })
result = supabase.table("vehicles").upsert(vehicles, on_conflict="code").execute()
print(f"  -> {len(result.data)} vehículos migrados")

# Construir map code -> id
code_to_id = {}
for v in supabase.table("vehicles").select("id,code").execute().data:
    code_to_id[v["code"]] = v["id"]

# 2. Migrar CSVs
for table, (filename, field_map) in CSV_MAP.items():
    path = os.path.join(OLD_DIR, filename)
    if not os.path.exists(path):
        print(f"  WARNING: {filename} no encontrado, saltando...")
        continue
    with open(path, encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    entries = []
    for row in rows:
        code = row.get("ID","").strip()
        vid = code_to_id.get(code)
        if not vid:
            continue
        entry = {"vehicle_id": vid}
        for old_k, new_k in field_map.items():
            entry[new_k] = row.get(old_k, "").strip()
        if "FECHA" in row and row["FECHA"].strip():
            try:
                fmt = "%d/%m/%Y %H:%M:%S" if " " in row["FECHA"] else "%d/%m/%Y"
                entry["created_at"] = datetime.strptime(row["FECHA"].strip(), fmt).isoformat()
            except:
                pass
        entries.append(entry)
    if entries:
        supabase.table(table).insert(entries).execute()
        print(f"  -> {len(entries)} registros en {table}")
    else:
        print(f"  -> 0 registros en {table}")

print("Migración completa")
```

### Paso 1.8: Configurar Auth en Supabase

```
1. En Supabase, ir a Authentication -> Providers -> Email
2. Habilitar, deshabilitar "Confirm email" (para pruebas)
3. Ir a Authentication -> Settings:
   - Site URL: http://localhost:5173
   - Redirect URLs: http://localhost:5173/**
4. Ir a Authentication -> Users -> Add user (crear 4 usuarios):
   - admin@muni.gov.ar    -> metadata: {"role":"admin"}
   - guardia@muni.gov.ar  -> metadata: {"role":"guard"}
   - mecanico@muni.gov.ar -> metadata: {"role":"mechanic"}
   - auditor@muni.gov.ar  -> metadata: {"role":"auditor"}
5. Asignar password temporal a cada uno
```

---

## FASE 2 — BACKEND COMPLETO (Semanas 2-3)

### Paso 2.1: Modelos SQLAlchemy

**Archivo `backend/app/models/all_models.py`:**

```python
from sqlalchemy import Column, String, Integer, Float, Date, DateTime, ForeignKey, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.database import Base

class Vehicle(Base):
    __tablename__ = "vehicles"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String, unique=True, nullable=False, index=True)
    type = Column(String, default="")
    brand = Column(String, default="")
    model = Column(String, default="")
    plate = Column(String, default="")
    year = Column(Integer, default=0)
    status = Column(String, default="ACTIVO", index=True)
    area = Column(String, default="")
    photo_url = Column(Text, default="")
    nfc_key = Column(String, unique=True, default="", index=True)
    engine = Column(String, default="")
    chassis = Column(String, default="")
    patrimony = Column(String, default="")
    driver = Column(String, default="")
    file_number = Column(String, default="")
    dni = Column(String, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class Movement(Base):
    __tablename__ = "movements"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False)
    action = Column(String, nullable=False)
    motive = Column(Text, default="")
    recorded_by = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    vehicle = relationship("Vehicle")

class FuelLog(Base):
    __tablename__ = "fuel_logs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False)
    fuel_type = Column(String, default="DIESEL (GASOIL)")
    liters = Column(Float, default=0)
    odometer = Column(Integer, default=0)
    recorded_by = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    vehicle = relationship("Vehicle")

class FluidsLog(Base):
    __tablename__ = "fluids_logs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False)
    category = Column(String, nullable=False)
    subtype = Column(String, nullable=False)
    quantity = Column(Float, default=0)
    unit = Column(String, default="Litros")
    recorded_by = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    vehicle = relationship("Vehicle")

class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=False)  # INTERNA, EXTERNA, LOGISTICA
    detail = Column(Text, default="")
    recorded_by = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    vehicle = relationship("Vehicle")

class PartRequest(Base):
    __tablename__ = "part_requests"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, default="PENDIENTE", index=True)
    note = Column(Text, default="")
    admin_note = Column(Text, default="")
    requested_by = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    vehicle = relationship("Vehicle")

class Audit(Base):
    __tablename__ = "audits"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, default="DIARIA / PRE-VIAJE")
    checklist_data = Column(JSON, default={})
    observations = Column(Text, default="")
    recorded_by = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    vehicle = relationship("Vehicle")

class Schedule(Base):
    __tablename__ = "schedules"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False)
    scheduled_date = Column(Date, nullable=False)
    maintenance_type = Column(String, nullable=False)
    status = Column(String, default="PENDIENTE", index=True)
    notes = Column(Text, default="")
    created_by = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    vehicle = relationship("Vehicle")
```

### Paso 2.2: Schemas Pydantic

**Archivo `backend/app/schemas/all_schemas.py`:**

```python
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel

class VehicleBase(BaseModel):
    code: str; type: str = ""; brand: str = ""; model: str = ""
    plate: str = ""; year: int = 0; status: str = "ACTIVO"; area: str = ""
    photo_url: str = ""; nfc_key: str = ""

class VehicleCreate(VehicleBase):
    engine: str = ""; chassis: str = ""; patrimony: str = ""
    driver: str = ""; file_number: str = ""; dni: str = ""

class VehicleUpdate(BaseModel):
    status: Optional[str] = None; area: Optional[str] = None
    driver: Optional[str] = None; photo_url: Optional[str] = None

class VehicleResponse(VehicleBase):
    id: str; engine: str = ""; chassis: str = ""; patrimony: str = ""
    driver: str = ""; file_number: str = ""; dni: str = ""
    created_at: Optional[datetime] = None; updated_at: Optional[datetime] = None

class MovementCreate(BaseModel):
    vehicle_code: str; action: str; motive: str = ""

class MovementResponse(BaseModel):
    id: str; vehicle_id: str; action: str; motive: str = ""
    created_at: Optional[datetime] = None

class FuelLogCreate(BaseModel):
    vehicle_code: str; fuel_type: str = "DIESEL (GASOIL)"
    liters: float = 0; odometer: int = 0

class FluidsLogCreate(BaseModel):
    vehicle_code: str; category: str; subtype: str; quantity: float

class MaintenanceLogCreate(BaseModel):
    vehicle_code: str; type: str; detail: str = ""

class PartRequestCreate(BaseModel):
    vehicle_code: str; note: str = ""

class PartRequestUpdate(BaseModel):
    status: str; admin_note: str = ""

class AuditCreate(BaseModel):
    vehicle_code: str; type: str = "DIARIA / PRE-VIAJE"
    checklist_data: dict = {}; observations: str = ""

class ScheduleCreate(BaseModel):
    vehicle_code: str; scheduled_date: date
    maintenance_type: str; notes: str = ""

class ScheduleUpdate(BaseModel):
    status: str; notes: str = ""
```

### Paso 2.3: Router de Auth

**Archivo `backend/app/routers/auth.py`:**

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
async def login(req: LoginRequest):
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{settings.supabase_url}/auth/v1/token?grant_type=password",
            json={"email": req.email, "password": req.password},
            headers={"apikey": settings.supabase_anon_key},
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    return resp.json()
```

### Paso 2.4: Router de Vehículos

**Archivo `backend/app/routers/vehicles.py`:**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.all_models import Vehicle
from app.schemas.all_schemas import VehicleCreate, VehicleUpdate, VehicleResponse

router = APIRouter(prefix="/vehicles", tags=["vehicles"])

@router.get("", response_model=list[VehicleResponse])
async def list_vehicles(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Vehicle).order_by(Vehicle.code))
    return result.scalars().all()

@router.get("/{code}", response_model=VehicleResponse)
async def get_vehicle(code: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Vehicle).where(Vehicle.code == code))
    v = result.scalar_one_or_none()
    if not v:
        raise HTTPException(404, "Vehículo no encontrado")
    return v

@router.post("", response_model=VehicleResponse)
async def create_vehicle(data: VehicleCreate, db: AsyncSession = Depends(get_db)):
    v = Vehicle(**data.model_dump())
    db.add(v)
    await db.commit()
    await db.refresh(v)
    return v

@router.patch("/{code}")
async def update_vehicle(code: str, data: VehicleUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Vehicle).where(Vehicle.code == code))
    v = result.scalar_one_or_none()
    if not v:
        raise HTTPException(404, "Vehículo no encontrado")
    for k, val in data.model_dump(exclude_unset=True).items():
        setattr(v, k, val)
    await db.commit()
    return {"ok": True}
```

### Paso 2.5: Routers de Operaciones

**Archivo `backend/app/routers/movements.py`:**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.all_models import Movement, Vehicle
from app.schemas.all_schemas import MovementCreate

router = APIRouter(prefix="/movements", tags=["movements"])

@router.get("")
async def list_movements(vehicle_code: str = None, limit: int = 50, db: AsyncSession = Depends(get_db)):
    q = select(Movement).order_by(Movement.created_at.desc()).limit(limit)
    if vehicle_code:
        vr = await db.execute(select(Vehicle.id).where(Vehicle.code == vehicle_code))
        v = vr.scalar_one_or_none()
        if v:
            q = q.where(Movement.vehicle_id == v)
    result = await db.execute(q)
    return result.scalars().all()

@router.post("")
async def create_movement(data: MovementCreate, db: AsyncSession = Depends(get_db)):
    vr = await db.execute(select(Vehicle).where(Vehicle.code == data.vehicle_code))
    v = vr.scalar_one_or_none()
    if not v:
        raise HTTPException(404, "Vehículo no encontrado")
    m = Movement(vehicle_id=v.id, action=data.action, motive=data.motive)
    db.add(m)
    await db.commit()
    return {"ok": True, "id": str(m.id)}
```

**Archivo `backend/app/routers/fuel.py`:**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.all_models import FuelLog, Vehicle
from app.schemas.all_schemas import FuelLogCreate

router = APIRouter(prefix="/fuel", tags=["fuel"])

@router.post("")
async def create_fuel(data: FuelLogCreate, db: AsyncSession = Depends(get_db)):
    vr = await db.execute(select(Vehicle).where(Vehicle.code == data.vehicle_code))
    v = vr.scalar_one_or_none()
    if not v:
        raise HTTPException(404, "Vehículo no encontrado")
    f = FuelLog(vehicle_id=v.id, fuel_type=data.fuel_type, liters=data.liters, odometer=data.odometer)
    db.add(f)
    await db.commit()
    return {"ok": True}

@router.get("")
async def list_fuel(vehicle_code: str = None, limit: int = 50, db: AsyncSession = Depends(get_db)):
    q = select(FuelLog).order_by(FuelLog.created_at.desc()).limit(limit)
    if vehicle_code:
        vr = await db.execute(select(Vehicle.id).where(Vehicle.code == vehicle_code))
        v = vr.scalar_one_or_none()
        if v:
            q = q.where(FuelLog.vehicle_id == v)
    result = await db.execute(q)
    return result.scalars().all()
```

**Archivo `backend/app/routers/fluids.py`:**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.all_models import FluidsLog, Vehicle
from app.schemas.all_schemas import FluidsLogCreate

router = APIRouter(prefix="/fluids", tags=["fluids"])

@router.post("")
async def create_fluids(data: FluidsLogCreate, db: AsyncSession = Depends(get_db)):
    vr = await db.execute(select(Vehicle).where(Vehicle.code == data.vehicle_code))
    v = vr.scalar_one_or_none()
    if not v:
        raise HTTPException(404, "Vehículo no encontrado")
    fl = FluidsLog(vehicle_id=v.id, category=data.category, subtype=data.subtype, quantity=data.quantity)
    db.add(fl)
    await db.commit()
    return {"ok": True}

@router.get("")
async def list_fluids(vehicle_code: str = None, limit: int = 50, db: AsyncSession = Depends(get_db)):
    q = select(FluidsLog).order_by(FluidsLog.created_at.desc()).limit(limit)
    if vehicle_code:
        vr = await db.execute(select(Vehicle.id).where(Vehicle.code == vehicle_code))
        v = vr.scalar_one_or_none()
        if v:
            q = q.where(FluidsLog.vehicle_id == v)
    result = await db.execute(q)
    return result.scalars().all()
```

**Archivo `backend/app/routers/maintenance.py`:**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.all_models import MaintenanceLog, Vehicle
from app.schemas.all_schemas import MaintenanceLogCreate

router = APIRouter(prefix="/maintenance", tags=["maintenance"])

@router.post("")
async def create_maintenance(data: MaintenanceLogCreate, db: AsyncSession = Depends(get_db)):
    vr = await db.execute(select(Vehicle).where(Vehicle.code == data.vehicle_code))
    v = vr.scalar_one_or_none()
    if not v:
        raise HTTPException(404, "Vehículo no encontrado")
    m = MaintenanceLog(vehicle_id=v.id, type=data.type, detail=data.detail)
    db.add(m)
    await db.commit()
    return {"ok": True}

@router.get("")
async def list_maintenance(vehicle_code: str = None, limit: int = 50, db: AsyncSession = Depends(get_db)):
    q = select(MaintenanceLog).order_by(MaintenanceLog.created_at.desc()).limit(limit)
    if vehicle_code:
        vr = await db.execute(select(Vehicle.id).where(Vehicle.code == vehicle_code))
        v = vr.scalar_one_or_none()
        if v:
            q = q.where(MaintenanceLog.vehicle_id == v)
    result = await db.execute(q)
    return result.scalars().all()
```

**Archivo `backend/app/routers/parts.py`:**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.all_models import PartRequest, Vehicle
from app.schemas.all_schemas import PartRequestCreate, PartRequestUpdate

router = APIRouter(prefix="/parts", tags=["parts"])

@router.post("")
async def create_part_request(data: PartRequestCreate, db: AsyncSession = Depends(get_db)):
    vr = await db.execute(select(Vehicle).where(Vehicle.code == data.vehicle_code))
    v = vr.scalar_one_or_none()
    if not v:
        raise HTTPException(404, "Vehículo no encontrado")
    pr = PartRequest(vehicle_id=v.id, note=data.note)
    db.add(pr)
    await db.commit()
    return {"ok": True, "id": str(pr.id)}

@router.get("")
async def list_part_requests(status: str = None, db: AsyncSession = Depends(get_db)):
    q = select(PartRequest).order_by(PartRequest.created_at.desc())
    if status:
        q = q.where(PartRequest.status == status.upper())
    result = await db.execute(q)
    return result.scalars().all()

@router.patch("/{part_id}")
async def update_part_request(part_id: str, data: PartRequestUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PartRequest).where(PartRequest.id == part_id))
    pr = result.scalar_one_or_none()
    if not pr:
        raise HTTPException(404, "Solicitud no encontrada")
    pr.status = data.status
    if data.admin_note:
        pr.admin_note = data.admin_note
    await db.commit()
    return {"ok": True}
```

**Archivo `backend/app/routers/audits.py`:**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.all_models import Audit, Vehicle
from app.schemas.all_schemas import AuditCreate

router = APIRouter(prefix="/audits", tags=["audits"])

@router.post("")
async def create_audit(data: AuditCreate, db: AsyncSession = Depends(get_db)):
    vr = await db.execute(select(Vehicle).where(Vehicle.code == data.vehicle_code))
    v = vr.scalar_one_or_none()
    if not v:
        raise HTTPException(404, "Vehículo no encontrado")
    a = Audit(vehicle_id=v.id, type=data.type, checklist_data=data.checklist_data, observations=data.observations)
    db.add(a)
    await db.commit()
    return {"ok": True}

@router.get("")
async def list_audits(vehicle_code: str = None, limit: int = 50, db: AsyncSession = Depends(get_db)):
    q = select(Audit).order_by(Audit.created_at.desc()).limit(limit)
    if vehicle_code:
        vr = await db.execute(select(Vehicle.id).where(Vehicle.code == vehicle_code))
        v = vr.scalar_one_or_none()
        if v:
            q = q.where(Audit.vehicle_id == v)
    result = await db.execute(q)
    return result.scalars().all()
```

**Archivo `backend/app/routers/schedules.py`:**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.all_models import Schedule, Vehicle
from app.schemas.all_schemas import ScheduleCreate, ScheduleUpdate

router = APIRouter(prefix="/schedules", tags=["schedules"])

@router.post("")
async def create_schedule(data: ScheduleCreate, db: AsyncSession = Depends(get_db)):
    vr = await db.execute(select(Vehicle).where(Vehicle.code == data.vehicle_code))
    v = vr.scalar_one_or_none()
    if not v:
        raise HTTPException(404, "Vehículo no encontrado")
    s = Schedule(vehicle_id=v.id, scheduled_date=data.scheduled_date, maintenance_type=data.maintenance_type, notes=data.notes)
    db.add(s)
    await db.commit()
    return {"ok": True}

@router.get("")
async def list_schedules(upcoming: bool = False, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import Date
    import datetime
    q = select(Schedule).order_by(Schedule.scheduled_date)
    if upcoming:
        q = q.where(Schedule.scheduled_date >= datetime.date.today()).where(Schedule.status == "PENDIENTE")
    result = await db.execute(q)
    return result.scalars().all()

@router.patch("/{schedule_id}")
async def update_schedule(schedule_id: str, data: ScheduleUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Schedule).where(Schedule.id == schedule_id))
    s = result.scalar_one_or_none()
    if not s:
        raise HTTPException(404, "Cronograma no encontrado")
    s.status = data.status
    if data.notes:
        s.notes = data.notes
    await db.commit()
    return {"ok": True}
```

### Paso 2.6: Router de QR

**Archivo `backend/app/routers/qr.py`:**

```python
from fastapi import APIRouter, HTTPException, Response
import qrcode
from PIL import Image
import requests as http_req
import io
from app.config import settings

router = APIRouter(prefix="/qr", tags=["qr"])

@router.get("/{code}")
async def generate_qr(code: str):
    qr = qrcode.QRCode(version=None, error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=15, border=2)
    qr.add_data(f"{settings.supabase_url}/ficha/{code}")
    qr.make(fit=True)
    img = qr.make_image(fill_color=settings.color_principal, back_color="white").convert("RGBA")

    if settings.qr_logo_url:
        try:
            resp = http_req.get(settings.qr_logo_url, stream=True)
            logo = Image.open(resp.raw).convert("RGBA")
            qw, qh = img.size
            lw, lh = int(qw * 0.45), int(qw * 0.36)
            logo = logo.resize((lw, lh), Image.Resampling.LANCZOS)
            pos = ((qw - lw) // 2, (qh - lh) // 2)
            img.paste(logo, pos, logo)
        except Exception as e:
            print(f"Logo QR fallo: {e}")

    buf = io.BytesIO()
    img.save(buf, "PNG")
    buf.seek(0)
    return Response(content=buf.getvalue(), media_type="image/png")
```

### Paso 2.7: Registrar todos los routers en main.py

Al final de `backend/app/main.py` agregar:

```python
from app.routers import auth, vehicles, movements, fuel, fluids, maintenance, parts, audits, schedules, qr

app.include_router(auth.router)
app.include_router(vehicles.router)
app.include_router(movements.router)
app.include_router(fuel.router)
app.include_router(fluids.router)
app.include_router(maintenance.router)
app.include_router(parts.router)
app.include_router(audits.router)
app.include_router(schedules.router)
app.include_router(qr.router)
```

### Paso 2.8: Verificar backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Abrir `http://localhost:8000/docs` -> debe mostrar Swagger UI con todos los endpoints.

---

## FASE 3 — FRONTEND COMPLETO (Semanas 4-5)

### Paso 3.1: Instalar dependencias

```bash
cd frontend
npm install
```

### Paso 3.2: Hook useOnlineStatus

**Archivo `frontend/src/hooks/useOnlineStatus.js`:**

```js
import { useEffect } from "react";
import { useStore } from "../store/useStore";

export function useOnlineStatus() {
  const setOnline = useStore((s) => s.setOnline);

  useEffect(() => {
    const handle = () => setOnline(navigator.onLine);
    window.addEventListener("online", handle);
    window.addEventListener("offline", handle);
    return () => {
      window.removeEventListener("online", handle);
      window.removeEventListener("offline", handle);
    };
  }, [setOnline]);
}
```

### Paso 3.3: Hook useSync

**Archivo `frontend/src/hooks/useSync.js`:**

```js
import { useEffect } from "react";
import { useStore } from "../store/useStore";
import { supabase } from "../services/supabase";
import db from "../services/offline";
import toast from "react-hot-toast";

export function useSync() {
  const { online, setVehicles } = useStore();

  useEffect(() => {
    (async () => {
      if (online) {
        const { data } = await supabase.from("vehicles").select("*");
        if (data) {
          setVehicles(data);
          await db.vehiclesCache.clear();
          await db.vehiclesCache.bulkAdd(data);
        }
      } else {
        const cached = await db.vehiclesCache.toArray();
        if (cached.length > 0) setVehicles(cached);
      }
    })();
  }, [online, setVehicles]);

  useEffect(() => {
    if (!online) return;
    (async () => {
      const queue = await db.syncQueue.orderBy("created_at").toArray();
      for (const item of queue) {
        try {
          await supabase.from(item.table).insert(item.data);
          await db.syncQueue.delete(item.id);
        } catch (e) {
          console.error("Sync fallo:", item, e);
        }
      }
      if (queue.length > 0) toast.success("Datos sincronizados");
    })();
  }, [online]);

  useEffect(() => {
    if (!online) return;
    const sub = supabase
      .channel("vehicles-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "vehicles" },
        (payload) => {
          const vehicles = useStore.getState().vehicles;
          if (payload.eventType === "INSERT") {
            setVehicles([...vehicles, payload.new]);
          } else if (payload.eventType === "UPDATE") {
            setVehicles(vehicles.map((v) => v.id === payload.new.id ? payload.new : v));
          }
        }
      )
      .subscribe();
    return () => sub.unsubscribe();
  }, [online, setVehicles]);
}

export async function offlineInsert(table, data) {
  if (navigator.onLine) {
    const { error } = await supabase.from(table).insert(data);
    if (error) throw error;
  } else {
    await db.syncQueue.add({ table, data, created_at: new Date().toISOString() });
    toast("Operacion guardada - se sincronizara cuando haya conexion");
  }
}
```

### Paso 3.4: Componentes de Layout

**Archivo `frontend/src/components/layout/OfflineBanner.jsx`:**

```jsx
import { useStore } from "../../store/useStore";

export default function OfflineBanner() {
  const online = useStore((s) => s.online);
  if (online) return null;
  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-2 font-bold z-50">
      Sin conexion - los datos se sincronizaran cuando vuelva internet
    </div>
  );
}
```

**Archivo `frontend/src/components/layout/Navbar.jsx`:**

```jsx
import { useStore } from "../../store/useStore";
import { LogOut, Wifi, WifiOff } from "lucide-react";

export default function Navbar() {
  const { user, online, setUser, setSession } = useStore();

  const handleLogout = async () => {
    const { supabase } = await import("../../services/supabase");
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-xl font-bold" style={{ color: "#009B77" }}>GI Flota</span>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">v2</span>
      </div>
      <div className="flex items-center gap-4">
        {online ? <Wifi size={16} className="text-green-500" /> : <WifiOff size={16} className="text-red-500" />}
        <span className="text-sm text-gray-600">{user?.email}</span>
        <button onClick={handleLogout} className="text-gray-400 hover:text-red-500">
          <LogOut size={18} />
        </button>
      </div>
    </nav>
  );
}
```

**Archivo `frontend/src/components/layout/Sidebar.jsx`:**

```jsx
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Truck, Wrench, ClipboardCheck, BarChart3, ScanLine } from "lucide-react";

const links = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/fleet", icon: Truck, label: "Flota" },
  { to: "/kiosk", icon: ScanLine, label: "Puesto NFC" },
  { to: "/workshop", icon: Wrench, label: "Taller" },
  { to: "/audit", icon: ClipboardCheck, label: "Auditoria" },
  { to: "/reports", icon: BarChart3, label: "Reportes" },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-4">
      <nav className="space-y-1">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition
               ${isActive ? "text-white" : "text-gray-600 hover:bg-gray-100"}`
            }
            style={({ isActive }) => isActive ? { backgroundColor: "#009B77" } : {}}
          >
            <l.icon size={18} />
            {l.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
```

**Archivo `frontend/src/components/layout/AppLayout.jsx`:**

```jsx
import { Outlet, Navigate } from "react-router-dom";
import { useStore } from "../../store/useStore";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import OfflineBanner from "./OfflineBanner";

export default function AppLayout() {
  const user = useStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex flex-col min-h-screen">
      <OfflineBanner />
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 bg-gray-50 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

### Paso 3.5: Páginas

**Archivo `frontend/src/pages/LoginPage.jsx`:**

```jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { useStore } from "../store/useStore";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setUser, setSession } = useStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) return setError(err.message);
    setUser(data.user);
    setSession(data.session);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#009B77" }}>
      <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold" style={{ color: "#009B77" }}>GI Flota</h1>
          <p className="text-gray-500 text-sm mt-1">Municipalidad de Florencio Varela</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#009B77] focus:border-transparent outline-none" required />
          <input type="password" placeholder="Contrasena" value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#009B77] focus:border-transparent outline-none" required />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit"
            className="w-full py-3 rounded-lg text-white font-bold text-sm transition hover:opacity-90"
            style={{ backgroundColor: "#009B77" }}>
            INGRESAR
          </button>
        </form>
      </div>
    </div>
  );
}
```

**Archivo `frontend/src/pages/DashboardPage.jsx`:**

```jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { useStore } from "../store/useStore";

export default function DashboardPage() {
  const vehicles = useStore((s) => s.vehicles);
  const setVehicles = useStore((s) => s.setVehicles);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from("vehicles").select("*").then(({ data }) => {
      if (data) setVehicles(data);
    });
  }, [setVehicles]);

  const total = vehicles.length;
  const activos = vehicles.filter((v) => v.status === "ACTIVO").length;
  const inactivos = total - activos;
  const pct = total ? Math.round((activos / total) * 100) : 0;

  const cards = [
    { label: "Unidades", value: total, color: "#009B77" },
    { label: "Activas", value: activos, color: "#28a745" },
    { label: "Inactivas", value: inactivos, color: "#dc3545" },
    { label: "Operatividad", value: `${pct}%`, color: "#DAA520" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-3xl font-bold" style={{ color: c.color }}>{c.value}</p>
            <p className="text-gray-500 text-sm mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Flota completa</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="pb-3 font-medium">Unidad</th>
                <th className="pb-3 font-medium">Tipo</th>
                <th className="pb-3 font-medium">Marca</th>
                <th className="pb-3 font-medium">Estado</th>
                <th className="pb-3 font-medium">Area</th>
                <th className="pb-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/fleet/${v.code}`)}>
                  <td className="py-3 font-bold">{v.code}</td>
                  <td className="py-3">{v.type}</td>
                  <td className="py-3">{v.brand} {v.model}</td>
                  <td className="py-3">
                    <span className="px-2 py-1 rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: v.status === "ACTIVO" ? "#28a745" : "#dc3545" }}>
                      {v.status}
                    </span>
                  </td>
                  <td className="py-3">{v.area}</td>
                  <td className="py-3 text-right">
                    <span className="text-[#009B77] font-medium text-xs">Ver detalle -></span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

**Archivo `frontend/src/pages/FleetPage.jsx`:**

```jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { Search } from "lucide-react";

export default function FleetPage() {
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from("vehicles").select("*").then(({ data }) => {
      if (data) setVehicles(data);
    });
  }, []);

  const filtered = vehicles.filter((v) =>
    Object.values(v).some((val) =>
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Flota</h1>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Buscar unidad, tipo, marca..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-64 outline-none focus:ring-2 focus:ring-[#009B77]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((v) => (
          <div key={v.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md transition"
            onClick={() => navigate(`/fleet/${v.code}`)}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xl font-bold text-[#009B77]">
                {v.code?.split("-")[1] || v.code?.[0]}
              </div>
              <div>
                <p className="font-bold text-gray-800">{v.code}</p>
                <p className="text-xs text-gray-500">{v.type}</p>
              </div>
              <span className="ml-auto px-2 py-1 rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: v.status === "ACTIVO" ? "#28a745" : "#dc3545" }}>
                {v.status}
              </span>
            </div>
            <p className="text-sm font-medium">{v.brand} {v.model}</p>
            <p className="text-xs text-gray-500">{v.area} - {v.plate}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Archivo `frontend/src/pages/VehicleDetailPage.jsx`:**

```jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../services/supabase";
import { ArrowLeft, Download } from "lucide-react";

export default function VehicleDetailPage() {
  const { code } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [movements, setMovements] = useState([]);
  const [fuel, setFuel] = useState([]);
  const [activeTab, setActiveTab] = useState("info");
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

  useEffect(() => {
    supabase.from("vehicles").select("*").eq("code", code).single().then(({ data }) => {
      if (data) setVehicle(data);
    });
    supabase.from("movements").select("*").order("created_at", { ascending: false }).limit(10)
      .then(({ data }) => { if (data) setMovements(data); });
    supabase.from("fuel_logs").select("*").order("created_at", { ascending: false }).limit(10)
      .then(({ data }) => { if (data) setFuel(data); });
  }, [code]);

  if (!vehicle) return <div className="text-center py-20 text-gray-400">Cargando...</div>;

  return (
    <div>
      <Link to="/fleet" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#009B77] mb-4">
        <ArrowLeft size={16} /> Volver a flota
      </Link>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{vehicle.code} - {vehicle.type}</h1>
        <div className="flex gap-2">
          <img src={`${apiUrl}/qr/${vehicle.code}`} alt="QR" className="w-16 h-16 border rounded" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[
            ["Marca", vehicle.brand], ["Modelo", vehicle.model],
            ["Patente", vehicle.plate], ["Ano", vehicle.year],
            ["Estado", vehicle.status], ["Area", vehicle.area],
            ["Motor", vehicle.engine], ["Chasis", vehicle.chassis],
            ["Chofer", vehicle.driver], ["DNI", vehicle.dni],
          ].map(([k, v]) => (
            <div key={k}>
              <p className="text-xs text-gray-500 uppercase">{k}</p>
              <p className="font-medium">{v || "-"}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {["info", "movements", "fuel"].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition
              ${activeTab === tab ? "text-white" : "text-gray-500 bg-white border"}`}
            style={activeTab === tab ? { backgroundColor: "#009B77" } : {}}>
            {tab === "info" ? "Info" : tab === "movements" ? "Movimientos" : "Combustible"}
          </button>
        ))}
      </div>

      {activeTab === "movements" && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          {movements.map((m) => (
            <div key={m.id} className="flex items-center gap-4 py-2 border-b border-gray-100">
              <span className="text-xs text-gray-400">{new Date(m.created_at).toLocaleDateString()}</span>
              <span className="font-bold text-sm">{m.action}</span>
              <span className="text-sm text-gray-500">{m.motive}</span>
            </div>
          ))}
          {movements.length === 0 && <p className="text-gray-400 text-sm">Sin movimientos</p>}
        </div>
      )}

      {activeTab === "fuel" && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          {fuel.map((f) => (
            <div key={f.id} className="flex items-center gap-4 py-2 border-b border-gray-100">
              <span className="text-xs text-gray-400">{new Date(f.created_at).toLocaleDateString()}</span>
              <span className="font-bold text-sm">{f.liters}L</span>
              <span className="text-sm text-gray-500">{f.fuel_type}</span>
              <span className="text-sm text-gray-500">KM: {f.odometer}</span>
            </div>
          ))}
          {fuel.length === 0 && <p className="text-gray-400 text-sm">Sin cargas de combustible</p>}
        </div>
      )}
    </div>
  );
}
```

**Archivo `frontend/src/pages/KioskPage.jsx`:**

```jsx
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { offlineInsert } from "../hooks/useSync";
import toast from "react-hot-toast";

export default function KioskPage() {
  const [step, setStep] = useState("nfc"); // nfc, vehicle, action, confirm
  const [vehicle, setVehicle] = useState(null);
  const [action, setAction] = useState("");
  const [motive, setMotive] = useState("");
  const nfcRef = useRef(null);
  const navigate = useNavigate();

  const handleNfcScan = async (e) => {
    const nfcKey = e.target.value.trim().toUpperCase();
    if (!nfcKey) return;
    const { data } = await supabase.from("vehicles").select("*").eq("nfc_key", nfcKey).single();
    if (data) {
      setVehicle(data);
      setStep("action");
      toast.success(`Unidad ${data.code} identificada`);
    } else {
      toast.error("Llave NFC no reconocida");
    }
    e.target.value = "";
  };

  const handleAction = async () => {
    if (action === "ENTRADA" || action === "SALIDA") {
      await offlineInsert("movements", { vehicle_code: vehicle.code, action, motive: "" });
      toast.success(`${action} registrada para ${vehicle.code}`);
      setStep("nfc");
      setVehicle(null);
      setAction("");
    } else {
      setStep("confirm");
    }
  };

  const handleIrregularidad = async () => {
    const data = { vehicle_code: vehicle.code, action: "NOVEDAD", motive };
    await offlineInsert("movements", data);
    if (motive.toLowerCase().includes("inactiv")) {
      await offlineInsert("part_requests", { vehicle_code: vehicle.code, note: motive });
    }
    toast.success("Novedad registrada");
    setStep("nfc");
    setVehicle(null);
    setAction("");
    setMotive("");
  };

  const focusNfc = () => { if (nfcRef.current) nfcRef.current.focus(); };

  return (
    <div className="max-w-lg mx-auto" onClick={focusNfc}>
      <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Puesto de Control</h1>

      {step === "nfc" && (
        <div className="bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-5xl mb-4">📡</p>
          <h2 className="text-lg font-bold mb-2">Esperando llave NFC</h2>
          <p className="text-sm text-gray-500">Acerque el llavero NFC al lector</p>
          <input ref={nfcRef} type="text" name="nfc" autoFocus
            onChange={handleNfcScan}
            className="opacity-0 absolute" autoComplete="off" />
        </div>
      )}

      {step === "action" && vehicle && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="text-center mb-4">
            <p className="text-sm text-gray-500">Unidad identificada</p>
            <p className="text-3xl font-bold" style={{ color: "#009B77" }}>{vehicle.code}</p>
            <p className="text-sm">{vehicle.brand} {vehicle.model}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => { setAction("ENTRADA"); handleAction(); }}
              className="py-6 rounded-xl text-white font-bold text-lg hover:opacity-90"
              style={{ backgroundColor: "#28a745" }}>
              📥 ENTRADA
            </button>
            <button onClick={() => { setAction("SALIDA"); handleAction(); }}
              className="py-6 rounded-xl text-white font-bold text-lg hover:opacity-90"
              style={{ backgroundColor: "#007bff" }}>
              📤 SALIDA
            </button>
          </div>
          <button onClick={() => setStep("confirm")}
            className="w-full mt-4 py-4 rounded-xl text-white font-bold hover:opacity-90"
            style={{ backgroundColor: "#fd7e14" }}>
            Reportar irregularidad
          </button>
        </div>
      )}

      {step === "confirm" && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-bold mb-3">Detalle del reporte</h3>
          <textarea value={motive} onChange={(e) => setMotive(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm mb-4" rows={3}
            placeholder="Describa el problema..." />
          <div className="grid grid-cols-2 gap-3">
            <button onClick={handleIrregularidad}
              className="py-3 rounded-xl text-white font-bold" style={{ backgroundColor: "#28a745" }}>
              Confirmar
            </button>
            <button onClick={() => setStep("action")}
              className="py-3 rounded-xl text-gray-700 font-bold bg-gray-200">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Archivo `frontend/src/pages/WorkshopPage.jsx`:**

```jsx
import { useState } from "react";
import { supabase } from "../services/supabase";
import { useStore } from "../store/useStore";
import toast from "react-hot-toast";

const FLUID_OPTS = {
  ACEITE_MOTOR: { unit: "Litros", opts: ["15W40","10W40","5W30","SAE40","5W40"] },
  TRANSMISION: { unit: "Litros", opts: ["80W90","85W140","75W90","ATF","STOU/UTTO"] },
  HIDRAULICO: { unit: "Litros", opts: ["ISO68","ISO46","ISO32"] },
  REFRIGERANTE: { unit: "Litros", opts: ["Organico","Inorganico","Agua Destilada"] },
  ADITIVOS_LIQ: { unit: "Litros", opts: ["AdBlue","Liquido de Frenos","Limpiaparabrisas"] },
  ADITIVOS_SOL: { unit: "Kilos", opts: ["Grasa de Litio"] },
};

export default function WorkshopPage() {
  const [tab, setTab] = useState("maintenance");
  const [vehicleCode, setVehicleCode] = useState("");
  const vehicles = useStore((s) => s.vehicles);

  const handleMaintenance = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const { error } = await supabase.from("maintenance_logs").insert({
      vehicle_code: fd.get("vehicle_code"),
      type: fd.get("type"),
      detail: fd.get("detail"),
    });
    if (error) return toast.error(error.message);
    toast.success("Mantenimiento registrado");
    e.target.reset();
  };

  const handleFuel = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const { error } = await supabase.from("fuel_logs").insert({
      vehicle_code: fd.get("vehicle_code"),
      fuel_type: fd.get("fuel_type"),
      liters: parseFloat(fd.get("liters")),
      odometer: parseInt(fd.get("odometer")),
    });
    if (error) return toast.error(error.message);
    toast.success("Combustible registrado");
    e.target.reset();
  };

  const handleFluid = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const { error } = await supabase.from("fluids_logs").insert({
      vehicle_code: fd.get("vehicle_code"),
      category: fd.get("category"),
      subtype: fd.get("subtype"),
      quantity: parseFloat(fd.get("quantity")),
    });
    if (error) return toast.error(error.message);
    toast.success("Fluido registrado");
    e.target.reset();
  };

  const tabs = [
    { id: "maintenance", label: "Reparacion" },
    { id: "fuel", label: "Combustible" },
    { id: "fluids", label: "Fluidos" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Taller</h1>
      <div className="flex gap-2 mb-4">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition
              ${tab === t.id ? "text-white" : "text-gray-500 bg-white border"}`}
            style={tab === t.id ? { backgroundColor: "#009B77" } : {}}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        {tab === "maintenance" && (
          <form onSubmit={handleMaintenance} className="space-y-4 max-w-md">
            <select name="vehicle_code" required
              className="w-full px-4 py-3 border rounded-lg text-sm" value={vehicleCode}
              onChange={(e) => setVehicleCode(e.target.value)}>
              <option value="">Seleccionar unidad</option>
              {vehicles.map((v) => <option key={v.id} value={v.code}>{v.code} - {v.brand}</option>)}
            </select>
            <select name="type" required className="w-full px-4 py-3 border rounded-lg text-sm">
              <option value="INTERNA">Reparacion interna (exitosa)</option>
              <option value="EXTERNA">Solicitar repuesto</option>
            </select>
            <textarea name="detail" required rows={3} placeholder="Descripcion del trabajo..."
              className="w-full px-4 py-3 border rounded-lg text-sm" />
            <button type="submit" className="w-full py-3 rounded-lg text-white font-bold" style={{ backgroundColor: "#009B77" }}>
              Registrar
            </button>
          </form>
        )}

        {tab === "fuel" && (
          <form onSubmit={handleFuel} className="space-y-4 max-w-md">
            <select name="vehicle_code" required className="w-full px-4 py-3 border rounded-lg text-sm">
              <option value="">Seleccionar unidad</option>
              {vehicles.map((v) => <option key={v.id} value={v.code}>{v.code}</option>)}
            </select>
            <select name="fuel_type" className="w-full px-4 py-3 border rounded-lg text-sm">
              <option>DIESEL (GASOIL)</option>
              <option>NAFTA</option>
              <option>GNC</option>
            </select>
            <input type="number" name="liters" step="0.1" placeholder="Litros" required
              className="w-full px-4 py-3 border rounded-lg text-sm" />
            <input type="number" name="odometer" placeholder="Odometro (KM)" required
              className="w-full px-4 py-3 border rounded-lg text-sm" />
            <button type="submit" className="w-full py-3 rounded-lg text-white font-bold" style={{ backgroundColor: "#DAA520" }}>
              Cargar combustible
            </button>
          </form>
        )}

        {tab === "fluids" && (
          <form onSubmit={handleFluid} className="space-y-4 max-w-md">
            <select name="vehicle_code" required className="w-full px-4 py-3 border rounded-lg text-sm">
              <option value="">Seleccionar unidad</option>
              {vehicles.map((v) => <option key={v.id} value={v.code}>{v.code}</option>)}
            </select>
            <select name="category" id="fluidCat" required
              className="w-full px-4 py-3 border rounded-lg text-sm"
              onChange={(e) => {
                const opts = FLUID_OPTS[e.target.value];
                const sub = document.getElementById("fluidSub");
                if (sub && opts) {
                  sub.innerHTML = opts.opts.map((o) => `<option>${o}</option>`).join("");
                }
              }}>
              <option value="">Seleccionar fluido</option>
              {Object.keys(FLUID_OPTS).map((k) => <option key={k} value={k}>{k.replace(/_/g, " ")}</option>)}
            </select>
            <select name="subtype" id="fluidSub" required className="w-full px-4 py-3 border rounded-lg text-sm" />
            <input type="number" name="quantity" step="0.1" placeholder="Cantidad" required
              className="w-full px-4 py-3 border rounded-lg text-sm" />
            <button type="submit" className="w-full py-3 rounded-lg text-white font-bold" style={{ backgroundColor: "#6f42c1" }}>
              Registrar fluido
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
```

### Paso 3.6: Actualizar App.jsx con layout y rutas completas

**Archivo `frontend/src/App.jsx`** (version final):

```jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import { useSync } from "./hooks/useSync";
import AppLayout from "./components/layout/AppLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import FleetPage from "./pages/FleetPage";
import VehicleDetailPage from "./pages/VehicleDetailPage";
import KioskPage from "./pages/KioskPage";
import WorkshopPage from "./pages/WorkshopPage";
import AuditPage from "./pages/AuditPage";
import ReportsPage from "./pages/ReportsPage";

export default function App() {
  useOnlineStatus();
  useSync();

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/fleet" element={<FleetPage />} />
          <Route path="/fleet/:code" element={<VehicleDetailPage />} />
          <Route path="/kiosk" element={<KioskPage />} />
          <Route path="/workshop" element={<WorkshopPage />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### Paso 3.7: Crear páginas restantes (scaffold mínimo)

**Archivo `frontend/src/pages/AuditPage.jsx`:**

```jsx
import { useState } from "react";
import { supabase } from "../services/supabase";
import { useStore } from "../store/useStore";
import { AUDIT_SECTIONS } from "../config/constants";
import toast from "react-hot-toast";

export default function AuditPage() {
  const [vehicleCode, setVehicleCode] = useState("");
  const [tab, setTab] = useState("checklist"); // checklist, schedule
  const vehicles = useStore((s) => s.vehicles);
  const [checks, setChecks] = useState({});
  const [observations, setObservations] = useState("");

  const handleChecklist = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from("audits").insert({
      vehicle_code: vehicleCode,
      type: "DIARIA / PRE-VIAJE",
      checklist_data: checks,
      observations,
    });
    if (error) return toast.error(error.message);
    toast.success("Checklist guardado");
    setChecks({});
    setObservations("");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Auditoria de Mantenimiento</h1>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab("checklist")}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === "checklist" ? "text-white" : "text-gray-500 bg-white border"}`}
          style={tab === "checklist" ? { backgroundColor: "#009B77" } : {}}>
          Checklist
        </button>
        <button onClick={() => setTab("schedule")}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === "schedule" ? "text-white" : "text-gray-500 bg-white border"}`}
          style={tab === "schedule" ? { backgroundColor: "#009B77" } : {}}>
          Preventivos
        </button>
      </div>

      {tab === "checklist" && (
        <form onSubmit={handleChecklist} className="bg-white rounded-xl shadow-sm border p-6 max-w-lg space-y-4">
          <select value={vehicleCode} onChange={(e) => setVehicleCode(e.target.value)} required
            className="w-full px-4 py-3 border rounded-lg text-sm">
            <option value="">Seleccionar unidad</option>
            {vehicles.map((v) => <option key={v.id} value={v.code}>{v.code}</option>)}
          </select>
          {AUDIT_SECTIONS.map((section) => (
            <div key={section.title} className="border rounded-lg p-4" style={{ borderLeftColor: "#DAA520", borderLeftWidth: 4 }}>
              <h3 className="font-bold text-sm mb-2">{section.title}</h3>
              {section.items.map((item) => (
                <label key={item} className="flex items-center gap-2 py-1 text-sm">
                  <input type="checkbox"
                    onChange={(e) => setChecks({ ...checks, [item]: e.target.checked })} />
                  {item}
                </label>
              ))}
            </div>
          ))}
          <textarea value={observations} onChange={(e) => setObservations(e.target.value)}
            placeholder="Observaciones" rows={3} className="w-full px-4 py-3 border rounded-lg text-sm" />
          <button type="submit" className="w-full py-3 rounded-lg text-white font-bold" style={{ backgroundColor: "#009B77" }}>
            Guardar revision
          </button>
        </form>
      )}
    </div>
  );
}
```

**Archivo `frontend/src/pages/ReportsPage.jsx`:** (scaffold base)

```jsx
import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

export default function ReportsPage() {
  const [stats, setStats] = useState({ total: 0, activos: 0, inactivos: 0, fuelTotal: 0 });

  useEffect(() => {
    (async () => {
      const { data: vehicles } = await supabase.from("vehicles").select("*");
      const { data: fuel } = await supabase.from("fuel_logs").select("liters");
      if (vehicles) {
        setStats({
          total: vehicles.length,
          activos: vehicles.filter((v) => v.status === "ACTIVO").length,
          inactivos: vehicles.filter((v) => v.status !== "ACTIVO").length,
          fuelTotal: fuel ? fuel.reduce((sum, f) => sum + (f.liters || 0), 0) : 0,
        });
      }
    })();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Reportes</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <p className="text-3xl font-bold" style={{ color: "#009B77" }}>{stats.total}</p>
          <p className="text-gray-500 text-sm">Total unidades</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <p className="text-3xl font-bold" style={{ color: "#28a745" }}>{stats.activos}</p>
          <p className="text-gray-500 text-sm">Unidades activas</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <p className="text-3xl font-bold" style={{ color: "#DAA520" }}>{stats.fuelTotal.toFixed(0)}L</p>
          <p className="text-gray-500 text-sm">Combustible total cargado</p>
        </div>
      </div>
    </div>
  );
}
```

### Paso 3.8: Verificar frontend

```bash
cd frontend
npm run dev
```

Abrir `http://localhost:5173` -> debe redirigir a `/login`.

---

## FASE 4 — PWA Y OFFLINE (Semana 6)

El Service Worker ya fue creado en Fase 1 (`public/sw.js`) con estrategia cache-first para assets estáticos.

El hook `useSync.js` ya maneja:
- Detección de online/offline
- Carga desde caché (IndexedDB) cuando está offline
- Cola de operaciones pendientes que se replay al reconectar
- Suscripción en tiempo real a cambios en Supabase

### Verificar PWA

```
1. Abrir Chrome DevTools -> Application -> Service Workers
2. Debe mostrar "sw.js" con status "activated"
3. Ir a Application -> Cache Storage -> debe mostrar "flota-v2-v1"
4. Desconectar WiFi (DevTools -> Network -> Offline)
5. Recargar pagina -> la app debe cargar sin conexion
6. Volver a conectar -> la cola de sync se procesa automaticamente
```

---

## FASE 5 — DASHBOARD Y REPORTES (Semana 7)

### Paso 5.1: Dashboard con Recharts

Agregar graficos en `DashboardPage.jsx` importando:
```jsx
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
```

Agregar despues de los KPIs:

```jsx
// Distribucion por estado
const statusData = [
  { name: "Activos", value: activos, color: "#28a745" },
  { name: "Inactivos", value: inactivos, color: "#dc3545" },
];

<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
  <div className="bg-white rounded-xl shadow-sm border p-6">
    <h3 className="font-semibold mb-4">Distribucion por estado</h3>
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
          {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  </div>
</div>
```

### Paso 5.2: Reportes PDF (backend)

**Archivo `backend/app/services/report_service.py`:**

```python
import io
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

def generar_ficha_pdf(vehicle: dict) -> bytes:
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    c.setFont("Helvetica-Bold", 18)
    c.setFillColorRGB(0, 0.6, 0.47)
    c.drawString(40, 800, f"FICHA TECNICA - {vehicle['code']}")
    c.setFont("Helvetica", 11)
    c.setFillColorRGB(0, 0, 0)
    y = 760
    for k, v in vehicle.items():
        if v and k not in ("id", "photo_url", "created_at", "updated_at"):
            c.drawString(50, y, f"{k.upper()}: {v}")
            y -= 20
    c.save()
    buf.seek(0)
    return buf.getvalue()
```

**Archivo `backend/app/routers/reports.py`:**

```python
from fastapi import APIRouter, HTTPException, Response
from supabase import create_client
from app.config import settings
from app.services.report_service import generar_ficha_pdf

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/ficha/{code}")
async def download_ficha(code: str):
    supabase = create_client(settings.supabase_url, settings.supabase_service_key)
    result = supabase.table("vehicles").select("*").eq("code", code).execute()
    if not result.data:
        raise HTTPException(404, "Vehículo no encontrado")
    pdf = generar_ficha_pdf(result.data[0])
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=ficha_{code}.pdf"}
    )
```

---

## FASE 6 — DEVOPS Y DEPLOY (Semana 8)

### Paso 6.1: Dockerizar backend

**Archivo `backend/Dockerfile`:**

```dockerfile
FROM python:3.14-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Paso 6.2: Deploy backend a Render

```
1. Ir a https://render.com -> Sign up (gratis)
2. New + -> Web Service
3. Conectar repositorio de GitHub
4. Root Directory: backend
5. Build Command: pip install -r requirements.txt
6. Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
7. Plan: Free ($0/mes, 750h)
8. Environment Variables: copiar las de backend/.env
9. Deploy
10. Obtener URL tipo: https://flota-api.onrender.com
```

### Paso 6.3: Deploy frontend a Cloudflare Pages

```
1. Ir a https://pages.cloudflare.com -> Sign up (gratis)
2. Create a project -> Connect Git repository
3. Build settings:
   - Build command: npm run build
   - Build output: dist
   - Root directory: frontend
4. Environment Variables: copiar frontend/.env
5. Deploy
6. Obtener URL tipo: https://flota-v2.pages.dev
```

### Paso 6.4: CI/CD con GitHub Actions

**Archivo `.github/workflows/deploy.yml`:**

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.14" }
      - run: pip install -r backend/requirements.txt

  deploy-render:
    needs: test-backend
    runs-on: ubuntu-latest
    steps:
      - run: curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}

  deploy-cloudflare:
    needs: test-backend
    runs-on: ubuntu-latest
    steps:
      - run: curl -X POST ${{ secrets.CLOUDFLARE_DEPLOY_HOOK }}
```

### Paso 6.5: Backup automático

En Supabase -> Database -> Backups -> habilitar "Daily backups" (incluido en free tier).

### Paso 6.6: .gitignore

**Archivo `.gitignore`:**

```
node_modules/
dist/
.env
__pycache__/
*.pyc
.venv/
*.sql.gz
```

---

## VERIFICACION DEL SISTEMA

### Lista de verificacion final

```
[ ] Supabase proyecto creado y schema ejecutado
[ ] 8 tablas visibles en Table Editor
[ ] backend/.env con credenciales reales
[ ] frontend/.env con credenciales reales
[ ] pip install -r backend/requirements.txt -> sin errores
[ ] uvicorn app.main:app -> /docs responde
[ ] npm install -> sin errores
[ ] npm run dev -> login page carga
[ ] Login con admin@muni.gov.ar -> dashboard con stats
[ ] /fleet muestra tabla de vehiculos
[ ] /fleet/UNIDAD-01 muestra detalle con QR
[ ] /kiosk -> escanear NFC simulado funciona
[ ] /workshop -> cargar combustible funciona
[ ] /audit -> checklist funciona
[ ] /qr/UNIDAD-01 -> descarga PNG con QR
[ ] /reports/ficha/UNIDAD-01 -> descarga PDF
[ ] Service Worker registrado (Chrome DevTools -> Application -> Service Workers)
[ ] Modo offline: desactivar WiFi, la app sigue funcionando con datos cacheados
[ ] Volver online: la cola de sincronizacion se vacia
[ ] Render deploy -> backend accesible desde internet
[ ] Cloudflare Pages deploy -> frontend accesible desde internet
[ ] Backup automatico configurado
```

---

## ANALISIS: CSV vs BASE DE DATOS

| Aspecto | CSV (actual) | Base de Datos (PostgreSQL) | Veredicto |
|---------|-------------|---------------------------|-----------|
| Lectura | Rapida, lineal | Con indices, mil veces mas rapido | DB gana |
| Escritura simultanea | Se corrompe con 2+ usuarios | ACID, transacciones | DB gana |
| Relaciones | No existen | FK, JOINs, cascade | DB gana |
| Integridad | Cualquier valor en cualquier columna | Tipos, constraints, CHECK | DB gana |
| Backup | Manual, propenso a perderse | Automatico (Supabase) | DB gana |
| Offline | Si, archivo local | Sin conexion no funciona | CSV gana |
| Simplicidad | Abris con Excel | Curva de aprendizaje | CSV gana |

**Conclusion:** Usar PostgreSQL como fuente de verdad + IndexedDB (PWA) como cache offline. La PWA con Dexie.js maneja el offline y sincroniza con Supabase cuando hay conexion. Es lo mejor de ambos mundos.

---

*Fin del documento — Plan completo y autonomo para replicacion por IA.*
