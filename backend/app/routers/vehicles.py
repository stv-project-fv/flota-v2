from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.all_models import Vehicle
from app.schemas.all_schemas import VehicleCreate, VehicleUpdate, VehicleResponse

router = APIRouter(prefix="/vehicles", tags=["vehicles"])

@router.get("", response_model=list[VehicleResponse])
async def list_vehicles(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Vehicle).order_by(Vehicle.code))
    return result.scalars().all()

@router.get("/{code}", response_model=VehicleResponse)
async def get_vehicle(code: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Vehicle).where(Vehicle.code == code))
    v = result.scalar_one_or_none()
    if not v:
        raise HTTPException(404, "Vehículo no encontrado")
    return v

@router.post("", response_model=VehicleResponse)
async def create_vehicle(data: VehicleCreate, db: AsyncSession = Depends(get_db)):
    v = Vehicle(**data.model_dump())
    db.add(v)
    await db.commit()
    await db.refresh(v)
    return v

@router.patch("/{code}")
async def update_vehicle(code: str, data: VehicleUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Vehicle).where(Vehicle.code == code))
    v = result.scalar_one_or_none()
    if not v:
        raise HTTPException(404, "Vehículo no encontrado")
    for k, val in data.model_dump(exclude_unset=True).items():
        setattr(v, k, val)
    await db.commit()
    return {"ok": True}
