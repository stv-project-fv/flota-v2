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
