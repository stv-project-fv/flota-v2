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
