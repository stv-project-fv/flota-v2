from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.all_models import Schedule, Vehicle
from app.schemas.all_schemas import ScheduleCreate, ScheduleUpdate

router = APIRouter(prefix="/schedules", tags=["schedules"])

@router.post("")
async def create_schedule(data: ScheduleCreate, db: AsyncSession = Depends(get_db)):
    vr = await db.execute(select(Vehicle).where(Vehicle.code == data.vehicle_code))
    v = vr.scalar_one_or_none()
    if not v:
        raise HTTPException(404, "Vehículo no encontrado")
    s = Schedule(vehicle_id=v.id, scheduled_date=data.scheduled_date, maintenance_type=data.maintenance_type, notes=data.notes)
    db.add(s)
    await db.commit()
    return {"ok": True}

@router.get("")
async def list_schedules(upcoming: bool = False, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import Date
    import datetime
    q = select(Schedule).order_by(Schedule.scheduled_date)
    if upcoming:
        q = q.where(Schedule.scheduled_date >= datetime.date.today()).where(Schedule.status == "PENDIENTE")
    result = await db.execute(q)
    return result.scalars().all()

@router.patch("/{schedule_id}")
async def update_schedule(schedule_id: str, data: ScheduleUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Schedule).where(Schedule.id == schedule_id))
    s = result.scalar_one_or_none()
    if not s:
        raise HTTPException(404, "Cronograma no encontrado")
    s.status = data.status
    if data.notes:
        s.notes = data.notes
    await db.commit()
    return {"ok": True}
