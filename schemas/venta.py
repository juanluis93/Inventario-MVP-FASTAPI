"""Schemas Pydantic para Venta y Detalle de Venta."""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class DetalleVentaCreate(BaseModel):
    producto_id: int = Field(..., gt=0)
    cantidad: int = Field(..., gt=0)


class DetalleVentaResponse(BaseModel):
    id: int
    producto_id: int
    cantidad: int
    precio_unitario: float

    model_config = {"from_attributes": True}


class VentaCreate(BaseModel):
    detalles: List[DetalleVentaCreate] = Field(..., min_length=1)


class VentaUpdate(BaseModel):
    detalles: Optional[List[DetalleVentaCreate]] = Field(None, min_length=1)


class VentaResponse(BaseModel):
    id: int
    fecha: datetime
    total: float
    estado: str
    detalles: List[DetalleVentaResponse] = []

    model_config = {"from_attributes": True}
