"""
Migración completa: Google Sheets + CSVs locales → Supabase

Uso:
  1. Copiar .env.example a .env y completar credenciales de Supabase
  2. python migrate_all.py

El script lee los datos del sistema actual (Google Sheets + CSVs)
y los inserta en las tablas de Supabase respetando el nuevo schema.
"""

import os
import csv
import json
import io
import uuid
from datetime import datetime

import requests
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# ─── Configuración ──────────────────────────────────────────────────────────

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

URL_FLOTA = (
    "https://docs.google.com/spreadsheets/d/e/"
    "2PACX-1vSqdZ6I77VKHqDefS3qrzvVw4LofQ4RLGqsSjs6VVns9P6Esu1Jg0eTRyW0UsW9m1UNrj_lG-VBLKxX/"
    "pub?gid=0&single=true&output=csv"
)

OLD_PROJECT_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "qr-data", "qr-data")

CSV_FILES = {
    "movements": "historial_actividad.csv",
    "fuel_logs": "historial_combustible.csv",
    "fluids_logs": "historial_fluidos.csv",
    "maintenance_logs": "historial_mantenimiento.csv",
    "part_requests": "estado_repuestos.csv",
    "schedules": "cronograma_preventivo.csv",
    "audits": "historial_preventivos.csv",
}

# ─── Inicializar Supabase ───────────────────────────────────────────────────

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

print(f"✅ Conectado a Supabase: {SUPABASE_URL}")


# ─── 1. Migrar Vehículos (desde Google Sheets) ──────────────────────────────

def migrate_vehicles():
    print("\n📦 Migrando vehículos desde Google Sheets...")
    r = requests.get(URL_FLOTA)
    r.encoding = "utf-8"
    reader = csv.DictReader(io.StringIO(r.text))

    vehicles = []
    for row in reader:
        vehicles.append({
            "code": row.get("ID", "").strip(),
            "type": row.get("TIPO", "").strip(),
            "brand": row.get("MARCA", "").strip(),
            "model": row.get("MODELO", "").strip(),
            "plate": row.get("DOMINIO", "").strip(),
            "year": int(row.get("AÑO", 0)) if row.get("AÑO", "").strip().isdigit() else 0,
            "status": row.get("ESTADO", "ACTIVO").strip().upper(),
            "area": row.get("AREA", "").strip(),
            "photo_url": row.get("FOTO_URL", "").strip(),
            "nfc_key": row.get("NFC_KEY", "").strip().upper(),
            "engine": row.get("MOTOR", "").strip(),
            "chassis": row.get("CHASIS", "").strip(),
            "patrimony": row.get("PATRIMONIO", "").strip(),
            "driver": row.get("CHOFER", "").strip(),
            "file_number": row.get("LEGAJO", "").strip(),
            "dni": row.get("DNI", "").strip(),
        })

    print(f"   → {len(vehicles)} vehículos encontrados")

    if vehicles:
        result = supabase.table("vehicles").upsert(vehicles, on_conflict="code").execute()
        print(f"   ✅ {len(result.data)} vehículos insertados/actualizados")
    else:
        print("   ⚠️ No se encontraron vehículos")

    return {v["code"]: v for v in vehicles}


# ─── 2. Migrar registros desde CSVs locales ─────────────────────────────────

def read_csv_local(filename):
    path = os.path.join(OLD_PROJECT_DIR, filename)
    if not os.path.exists(path):
        print(f"   ⚠️ Archivo no encontrado: {filename}")
        return []
    with open(path, mode="r", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def migrate_from_csv(table_name, filename, field_mapping, vehicle_map):
    print(f"\n📦 Migrando {table_name} desde {filename}...")
    rows = read_csv_local(filename)
    if not rows:
        return

    mapped = []
    skipped = 0
    for row in rows:
        code = row.get("ID", "").strip()
        vehicle = vehicle_map.get(code)
        if not vehicle:
            skipped += 1
            continue

        entry = {"vehicle_code": code}
        for old_field, new_field in field_mapping.items():
            entry[new_field] = row.get(old_field, "").strip()

        if "FECHA" in row and row["FECHA"].strip():
            try:
                if " " in row["FECHA"]:
                    dt = datetime.strptime(row["FECHA"].strip(), "%d/%m/%Y %H:%M:%S")
                else:
                    dt = datetime.strptime(row["FECHA"].strip(), "%d/%m/%Y")
                entry["created_at"] = dt.isoformat()
            except ValueError:
                entry["created_at"] = datetime.utcnow().isoformat()

        mapped.append(entry)

    if mapped:
        result = supabase.table(table_name).insert(mapped).execute()
        print(f"   ✅ {len(result.data)} insertados ({skipped} saltados por vehículo no encontrado)")
    else:
        print(f"   ⚠️ 0 registros migrados ({skipped} saltados)")


# ─── 3. Ejecutar migración completa ─────────────────────────────────────────

def main():
    print("=" * 60)
    print("  GEOOBRAS FLOTA V2 - Migración de Datos")
    print("=" * 60)

    # 1. Migrar vehículos primero (necesitamos el map para el resto)
    vehicle_map_data = migrate_vehicles()

    vehicle_map = {}
    for code, v in vehicle_map_data.items():
        vehicle_map[code] = v
        result = supabase.table("vehicles").select("id").eq("code", code).execute()
        if result.data:
            vehicle_map[code] = {"code": code, "id": result.data[0]["id"]}

    if not vehicle_map:
        print("\n❌ No hay vehículos en Supabase. Abortando migración de CSVs.")
        return

    # 2. Migrar movimientos (Entradas/Salidas)
    migrate_from_csv("movements", "historial_actividad.csv",
        {"ACCION": "action", "MOTIVO": "motive", "RESPONSABLE": "recorded_by"},
        vehicle_map
    )

    # 3. Migrar combustible
    migrate_from_csv("fuel_logs", "historial_combustible.csv",
        {"TIPO": "fuel_type", "LITROS": "liters", "KM": "odometer", "RESPONSABLE": "recorded_by"},
        vehicle_map
    )

    # 4. Migrar fluidos
    migrate_from_csv("fluids_logs", "historial_fluidos.csv",
        {"CAT": "category", "SUBTIPO": "subtype", "CANT": "quantity", "RESPONSABLE": "recorded_by"},
        vehicle_map
    )

    # 5. Migrar mantenimiento
    migrate_from_csv("maintenance_logs", "historial_mantenimiento.csv",
        {"TIPO": "type", "DETALLE": "detail", "RESPONSABLE": "recorded_by"},
        vehicle_map
    )

    # 6. Migrar solicitudes de repuesto
    migrate_from_csv("part_requests", "estado_repuestos.csv",
        {"ESTADO": "status", "NOTA": "note", "FECHA_UPDATE": "updated_at", "RESPONSABLE": "requested_by"},
        vehicle_map
    )

    # 7. Migrar cronograma preventivo
    migrate_from_csv("schedules", "cronograma_preventivo.csv",
        {"FECHA_PROGRAMADA": "scheduled_date", "TIPO_MANTENIMIENTO": "maintenance_type",
         "ESTADO": "status", "NOTA": "notes", "RESPONSABLE": "created_by"},
        vehicle_map
    )

    # 8. Migrar auditorías
    migrate_from_csv("audits", "historial_preventivos.csv",
        {"TIPO": "type", "DETALLE": "observations", "RESPONSABLE": "recorded_by"},
        vehicle_map
    )

    print("\n" + "=" * 60)
    print("  ✅ Migración completada exitosamente")
    print("=" * 60)


if __name__ == "__main__":
    main()
