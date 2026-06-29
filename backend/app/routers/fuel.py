from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.all_models import FuelLog, Vehicle
from app.schemas.all_schemas import FuelLogCreate

router = APIRouter(prefix="/fuel", tags=["fuel"])

@router.post("")
async def create_fuel(data: FuelLogCreate, db: AsyncSession = Depends(get_db)):
    vr = await db.execute(select(Vehicle).where(Vehicle.code == data.vehicle_code))
    v = vr.scalar_one_or_none()
    if not v:
        raise HTTPException(404, "Vehículo no encontrado")
    f = FuelLog(vehicle_id=v.id, fuel_type=data.fuel_type, liters=data.liters, odometer=data.odometer)
    db.add(f)
    await db.commit()
    return {"ok": True}

@router.get("")
async def list_fuel(vehicle_code: str = None, limit: int = 50, db: AsyncSession = Depends(get_db)):
    q = select(FuelLog).order_by(FuelLog.created_at.desc()).limit(limit)
    if vehicle_code:
        vr = await db.execute(select(Vehicle.id).where(Vehicle.code == vehicle_code))
        v = vr.scalar_one_or_none()
        if v:
            q = q.where(FuelLog.vehicle_id == v)
    result = await db.execute(q)
    return result.scalars().all()
