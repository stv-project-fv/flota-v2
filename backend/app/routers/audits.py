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
