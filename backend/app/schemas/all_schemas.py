from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel

class VehicleBase(BaseModel):
    code: str
    type: str = ""
    brand: str = ""
    model: str = ""
    plate: str = ""
    year: int = 0
    status: str = "ACTIVO"
    area: str = ""
    photo_url: str = ""
    nfc_key: str = ""

class VehicleCreate(VehicleBase):
    engine: str = ""
    chassis: str = ""
    patrimony: str = ""
    driver: str = ""
    file_number: str = ""
    dni: str = ""

class VehicleUpdate(BaseModel):
    status: Optional[str] = None
    area: Optional[str] = None
    driver: Optional[str] = None
    photo_url: Optional[str] = None

class VehicleResponse(VehicleBase):
    id: str
    engine: str = ""
    chassis: str = ""
    patrimony: str = ""
    driver: str = ""
    file_number: str = ""
    dni: str = ""
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class MovementCreate(BaseModel):
    vehicle_code: str
    action: str
    motive: str = ""

class MovementResponse(BaseModel):
    id: str
    vehicle_id: str
    action: str
    motive: str = ""
    created_at: Optional[datetime] = None

class FuelLogCreate(BaseModel):
    vehicle_code: str
    fuel_type: str = "DIESEL (GASOIL)"
    liters: float = 0
    odometer: int = 0

class FluidsLogCreate(BaseModel):
    vehicle_code: str
    category: str
    subtype: str
    quantity: float

class MaintenanceLogCreate(BaseModel):
    vehicle_code: str
    type: str
    detail: str = ""

class PartRequestCreate(BaseModel):
    vehicle_code: str
    note: str = ""

class PartRequestUpdate(BaseModel):
    status: str
    admin_note: str = ""

class AuditCreate(BaseModel):
    vehicle_code: str
    type: str = "DIARIA / PRE-VIAJE"
    checklist_data: dict = {}
    observations: str = ""

class ScheduleCreate(BaseModel):
    vehicle_code: str
    scheduled_date: date
    maintenance_type: str
    notes: str = ""

class ScheduleUpdate(BaseModel):
    status: str
    notes: str = ""
