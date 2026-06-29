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
