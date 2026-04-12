"""Modelo de Producto."""
from sqlalchemy import Column, Integer, String, Float
from sqlalchemy.orm import relationship
from database.connection import Base


class Producto(Base):
    __tablename__ = "productos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String(100), nullable=False, index=True)
    descripcion = Column(String(500), nullable=True)
    precio = Column(Float, nullable=False)
    stock = Column(Integer, nullable=False, default=0)

    detalles = relationship("DetalleVenta", back_populates="producto")
