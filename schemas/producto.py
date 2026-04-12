"""Schemas Pydantic para Producto."""
from pydantic import BaseModel, Field
from typing import Optional


class ProductoBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=100, examples=["Laptop HP"])
    descripcion: Optional[str] = Field(None, max_length=500)
    precio: float = Field(..., gt=0, examples=[999.99])
    stock: int = Field(..., ge=0, examples=[50])


class ProductoCreate(ProductoBase):
    pass


class ProductoUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=1, max_length=100)
    descripcion: Optional[str] = Field(None, max_length=500)
    precio: Optional[float] = Field(None, gt=0)
    stock: Optional[int] = Field(None, ge=0)


class ProductoResponse(ProductoBase):
    id: int

    model_config = {"from_attributes": True}
