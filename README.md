# GeoObras Flota v2.0

Sistema de Gestión de Flota Vehicular — Municipalidad de Florencio Varela

---

## Setup Paso a Paso

### Requisitos
- Node.js 20+ (tienes v24.14.0 ✓)
- Python 3.12+ (tienes v3.14.3 ✓)
- Una cuenta gratis en [Supabase](https://supabase.com)

### 1. Crear proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com) y crear cuenta gratis
2. Crear un nuevo proyecto (región: **South America — São Paulo**)
3. Guardar la contraseña de la base de datos
4. Ir a **Project Settings → API** y copiar:
   - `Project URL` → para `SUPABASE_URL`
   - `anon public` → para `SUPABASE_ANON_KEY`
   - `service_role` → para `SUPABASE_SERVICE_KEY`
5. Ir a **Project Settings → Auth** y copiar `JWT Secret`

### 2. Cargar el schema de la base de datos

1. En Supabase, ir a **SQL Editor**
2. Crear un nuevo snippet y pegar el contenido de `database/001_schema.sql`
3. Ejecutar (Run)

Esto crea las 8 tablas, índices, triggers y políticas de seguridad.

### 3. Configurar variables de entorno

```bash
# Backend — editar backend/.env con tus valores
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_KEY=eyJhbGciOi...

# Frontend — editar frontend/.env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### 4. Migrar datos del sistema anterior

```bash
cd scripts
pip install -r requirements.txt   # o: pip install supabase python-dotenv requests
python migrate_all.py
```

El script lee:
- Google Sheets → tabla `vehicles`
- CSVs locales (historial_actividad.csv, etc.) → tablas correspondientes

### 5. Configurar Autenticación

En Supabase → **Authentication → Providers**:
1. Habilitar **Email** (sin confirmación para pruebas)
2. Ir a **Authentication → Settings**:
   - `Site URL`: `http://localhost:5173`
   - `Redirect URLs`: `http://localhost:5173/**`

Crear usuarios desde **Authentication → Users**:
- admin@muni.gov.ar (rol: admin)
- mecanico@muni.gov.ar (rol: mechanic)
- auditor@muni.gov.ar (rol: auditor)

### 6. Instalar y ejecutar backend

```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate   # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 7. Instalar y ejecutar frontend

```bash
cd frontend
npm install
npm run dev
```

Abrir en el navegador: `http://localhost:5173`

---

## Estructura del Proyecto

```
flota-v2/
├── backend/                     # API REST (FastAPI)
│   ├── app/
│   │   ├── main.py             # Punto de entrada
│   │   ├── config.py           # Variables de entorno
│   │   ├── database.py         # Conexión Supabase/PostgreSQL
│   │   ├── models/             # Modelos SQLAlchemy
│   │   ├── schemas/            # Schemas Pydantic
│   │   ├── routers/            # Endpoints REST
│   │   └── services/           # Lógica de negocio
│   └── requirements.txt
├── frontend/                    # PWA (React + Vite + Tailwind)
│   ├── src/
│   │   ├── App.jsx             # Router principal
│   │   ├── main.jsx            # Entry point + Service Worker
│   │   ├── index.css           # Tailwind + tokens de diseño
│   │   ├── config/constants.js # Paleta y constantes
│   │   ├── store/useStore.js   # Estado global (Zustand)
│   │   └── services/           # Supabase client + offline
│   ├── public/
│   │   ├── manifest.json       # PWA manifest
│   │   └── sw.js               # Service Worker (offline)
│   └── package.json
├── database/
│   └── 001_schema.sql          # Schema SQL (ejecutar en Supabase)
├── scripts/
│   └── migrate_all.py          # Migración de datos antiguos
└── README.md
```

## Tablas (8)

| Tabla | Reemplaza | Propósito |
|-------|-----------|-----------|
| `vehicles` | Google Sheets | Catálogo de vehículos |
| `movements` | historial_actividad.csv | Entradas/Salidas |
| `fuel_logs` | historial_combustible.csv | Carga de combustible |
| `fluids_logs` | historial_fluidos.csv | Lubricantes y fluidos |
| `maintenance_logs` | historial_mantenimiento.csv | Órdenes de reparación |
| `part_requests` | estado_repuestos.csv | Solicitudes de repuestos |
| `audits` | historial_preventivos.csv | Checklists de auditoría |
| `schedules` | cronograma_preventivo.csv | Mantenimiento programado |
