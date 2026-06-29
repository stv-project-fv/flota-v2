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
