"""
Seed: importa vehículos desde Google Sheets a Supabase.
Uso: python scripts/seed_from_sheets.py
Requisito: ejecutar database/002_migracion.sql en Supabase SQL Editor antes.
"""

import csv, io, os
import requests
from supabase import create_client
from dotenv import load_dotenv

load_dotenv("backend/.env")

SHEET_URL = (
    "https://docs.google.com/spreadsheets/d/e/"
    "2PACX-1vRU_iWqEQETjf8NcTkqaKsciFQQp7FsEdrdvo-bxH3kN5E87awaHb4oqODO2PgtXN1P5Gl3VGuEtuBl"
    "/pub?gid=1643077296&single=true&output=csv"
)

STATUS_MAP = {
    "ACTIVO": "ACTIVO", "ACTIVA": "ACTIVO",
    "INACTIVO": "INACTIVO", "INACTIVA": "INACTIVO",
    "IRRECUPERABLE": "IRRECUPERABLE",
}

def clean(val):
    val = (val or "").strip().replace("\u00a0", " ")
    return val

def parse_year(val):
    val = val.strip()
    if val.isdigit():
        return int(val)
    try:
        return int(float(val))
    except:
        return 0

supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

print("Descargando datos desde Google Sheets...")
r = requests.get(SHEET_URL)
r.encoding = "utf-8"
reader = csv.DictReader(io.StringIO(r.text))

vehicles = []
for row in reader:
    code = clean(row.get("UNIDAD"))
    if not code:
        continue

    raw_status = clean(row.get("ESTADO")).upper()
    status = STATUS_MAP.get(raw_status, "ACTIVO")

    vehicle = {
        "code": code,
        "type": clean(row.get("TIPO")),
        "brand": clean(row.get("MARCA")),
        "model": clean(row.get("MODELO")),
        "plate": clean(row.get("DOMINIO")),
        "year": parse_year(row.get("AÑO")),
        "status": status,
        "area": clean(row.get("ÁREA")),
        "photo_url": clean(row.get("FOTO")),
        "nfc_key": f"NFC-{code.upper()}",
        "engine": clean(row.get("MOTOR")),
        "chassis": clean(row.get("CHASIS")),
        "patrimony": clean(row.get("PATRIMONIO")),
        "file_number": clean(row.get("EX")),
        "diagnostico": clean(row.get("DIAGNÓSTICO")),
        "costo": clean(row.get("COSTO")),
        "costo_total": clean(row.get("COST_TOTAL")),
        "presupuesto": clean(row.get("PRESUPU")),
        "proveedor": clean(row.get("PROV")),
        "fec_gest": clean(row.get("FEC_GEST")),
        "orden_compra": clean(row.get("oc")),
        "factura": clean(row.get("fct")),
    }
    vehicles.append(vehicle)

print(f"Total: {len(vehicles)} vehículos")

inserted = 0
errors = []
for start in range(0, len(vehicles), 20):
    batch = vehicles[start : start + 20]
    try:
        result = supabase.table("vehicles").upsert(batch, on_conflict="code").execute()
        inserted += len(result.data)
        print(f"  Lote {start//20 + 1}: {len(result.data)} ok")
    except Exception as e:
        print(f"  Lote {start//20 + 1}: ERROR - {e}")
        errors.append(str(e))

from collections import Counter
res = supabase.table("vehicles").select("status", count="exact").execute()
c = Counter(v["status"] for v in res.data)

print(f"\nInsertados: {inserted}")
print(f"Distribución: ACTIVO={c.get('ACTIVO',0)}  INACTIVO={c.get('INACTIVO',0)}  IRRECUPERABLE={c.get('IRRECUPERABLE',0)}")
if errors:
    print(f"Errores: {len(errors)}")
else:
    print("Sin errores")
