from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.all_models import Movement, Vehicle
from app.schemas.all_schemas import MovementCreate

router = APIRouter(prefix="/movements", tags=["movements"])

@router.get("")
async def list_movements(vehicle_code: str = None, limit: int = 50, db: AsyncSession = Depends(get_db)):
    q = select(Movement).order_by(Movement.created_at.desc()).limit(limit)
    if vehicle_code:
        vr = await db.execute(select(Vehicle.id).where(Vehicle.code == vehicle_code))
        v = vr.scalar_one_or_none()
        if v:
            q = q.where(Movement.vehicle_id == v)
    result = await db.execute(q)
    return result.scalars().all()

@router.post("")
async def create_movement(data: MovementCreate, db: AsyncSession = Depends(get_db)):
    vr = await db.execute(select(Vehicle).where(Vehicle.code == data.vehicle_code))
    v = vr.scalar_one_or_none()
    if not v:
        raise HTTPException(404, "Vehículo no encontrado")
    m = Movement(vehicle_id=v.id, action=data.action, motive=data.motive)
    db.add(m)
    await db.commit()
    return {"ok": True, "id": str(m.id)}
