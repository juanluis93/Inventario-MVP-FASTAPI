"""Schemas Pydantic para Producto."""
from pydantic import BaseModel, Field
from typing import Optional, Literal


CATEGORIAS_DEFAULT = [
    "Abarrotes",
    "Bebidas",
    "Limpieza",
    "Lacteos",
    "Snacks",
    "Cuidado personal",
]

CategoriaProducto = Literal[
    "Abarrotes",
    "Bebidas",
    "Limpieza",
    "Lacteos",
    "Snacks",
    "Cuidado personal",
]


class ProductoBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=100, examples=["Laptop HP"])
    descripcion: str = Field(..., min_length=1, max_length=500)
    categoria: CategoriaProducto = Field(..., examples=["Abarrotes"])
    precio: float = Field(..., gt=0, examples=[999.99])
    stock: int = Field(..., ge=0, examples=[50])


class ProductoCreate(ProductoBase):
    pass


class ProductoUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=1, max_length=100)
    descripcion: Optional[str] = Field(None, min_length=1, max_length=500)
    categoria: Optional[CategoriaProducto] = None
    precio: Optional[float] = Field(None, gt=0)
    stock: Optional[int] = Field(None, ge=0)


class ProductoResponse(ProductoBase):
    id: int
    codigo: str

    model_config = {"from_attributes": True}
