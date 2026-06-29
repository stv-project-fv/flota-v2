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
