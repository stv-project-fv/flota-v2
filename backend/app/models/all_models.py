from sqlalchemy import Column, String, Integer, Float, Date, DateTime, ForeignKey, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.database import Base

class Vehicle(Base):
    __tablename__ = "vehicles"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String, unique=True, nullable=False, index=True)
    type = Column(String, default="")
    brand = Column(String, default="")
    model = Column(String, default="")
    plate = Column(String, default="")
    year = Column(Integer, default=0)
    status = Column(String, default="ACTIVO", index=True)
    area = Column(String, default="")
    photo_url = Column(Text, default="")
    nfc_key = Column(String, unique=True, default="", index=True)
    engine = Column(String, default="")
    chassis = Column(String, default="")
    patrimony = Column(String, default="")
    driver = Column(String, default="")
    file_number = Column(String, default="")
    dni = Column(String, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class Movement(Base):
    __tablename__ = "movements"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False)
    action = Column(String, nullable=False)
    motive = Column(Text, default="")
    recorded_by = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    vehicle = relationship("Vehicle")

class FuelLog(Base):
    __tablename__ = "fuel_logs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False)
    fuel_type = Column(String, default="DIESEL (GASOIL)")
    liters = Column(Float, default=0)
    odometer = Column(Integer, default=0)
    recorded_by = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    vehicle = relationship("Vehicle")

class FluidsLog(Base):
    __tablename__ = "fluids_logs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False)
    category = Column(String, nullable=False)
    subtype = Column(String, nullable=False)
    quantity = Column(Float, default=0)
    unit = Column(String, default="Litros")
    recorded_by = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    vehicle = relationship("Vehicle")

class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=False)
    detail = Column(Text, default="")
    recorded_by = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    vehicle = relationship("Vehicle")

class PartRequest(Base):
    __tablename__ = "part_requests"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, default="PENDIENTE", index=True)
    note = Column(Text, default="")
    admin_note = Column(Text, default="")
    requested_by = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    vehicle = relationship("Vehicle")

class Audit(Base):
    __tablename__ = "audits"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, default="DIARIA / PRE-VIAJE")
    checklist_data = Column(JSON, default={})
    observations = Column(Text, default="")
    recorded_by = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    vehicle = relationship("Vehicle")

class Schedule(Base):
    __tablename__ = "schedules"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False)
    scheduled_date = Column(Date, nullable=False)
    maintenance_type = Column(String, nullable=False)
    status = Column(String, default="PENDIENTE", index=True)
    notes = Column(Text, default="")
    created_by = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    vehicle = relationship("Vehicle")
