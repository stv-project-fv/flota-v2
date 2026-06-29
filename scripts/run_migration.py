import os, sys, urllib.parse

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "backend", ".env"))

SUPABASE_URL = os.environ["SUPABASE_URL"]
SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

parts = SUPABASE_URL.replace("https://", "").split(".")
ref = parts[0]

pass_encoded = urllib.parse.quote(SERVICE_KEY, safe="")
DATABASE_URL = f"postgresql://postgres:{pass_encoded}@db.{ref}.supabase.co:5432/postgres"

import psycopg2

sql_path = os.path.join(os.path.dirname(__file__), "..", "database", "002_migracion.sql")
with open(sql_path, encoding="utf-8") as f:
    sql = f.read()

print("Conectando a Supabase PostgreSQL...")
conn = psycopg2.connect(DATABASE_URL, sslmode="require")
conn.autocommit = True
cur = conn.cursor()

statements = [s.strip() for s in sql.split(";") if s.strip()]
ok = 0
for stmt in statements:
    try:
        cur.execute(stmt)
        ok += 1
        print(f"  OK ({ok}): {stmt[:60]}...")
    except Exception as e:
        err = str(e).split("\n")[0] if "\n" in str(e) else str(e)
        print(f"  SKIP: {err}")

cur.close()
conn.close()
print(f"\nEjecutadas: {ok}/{len(statements)} sentencias")
