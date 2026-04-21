"""Modelo de Venta."""
from sqlalchemy import Column, Integer, Float, String, DateTime, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from database.connection import Base


class EstadoVenta(str, enum.Enum):
    ACTIVA = "activa"
    ANULADA = "anulada"


class Venta(Base):
    __tablename__ = "ventas"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    numero_venta = Column(String(30), nullable=False, unique=True, index=True)
    fecha = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    total = Column(Float, nullable=False, default=0.0)
    estado = Column(SAEnum(EstadoVenta), default=EstadoVenta.ACTIVA, nullable=False)

    detalles = relationship("DetalleVenta", back_populates="venta", cascade="all, delete-orphan")
