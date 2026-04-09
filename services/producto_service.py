"""Lógica de negocio para Productos."""
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.producto import Producto
from app.schemas.producto import ProductoCreate, ProductoUpdate


def listar_productos(db: Session, skip: int = 0, limit: int = 100) -> list[Producto]:
    return db.query(Producto).offset(skip).limit(limit).all()


def obtener_producto(db: Session, producto_id: int) -> Producto:
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
    return producto


def crear_producto(db: Session, data: ProductoCreate) -> Producto:
    producto = Producto(**data.model_dump())
    db.add(producto)
    db.commit()
    db.refresh(producto)
    return producto


def actualizar_producto(db: Session, producto_id: int, data: ProductoUpdate) -> Producto:
    producto = obtener_producto(db, producto_id)
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(producto, key, value)
    db.commit()
    db.refresh(producto)
    return producto


def eliminar_producto(db: Session, producto_id: int) -> None:
    producto = obtener_producto(db, producto_id)
    db.delete(producto)
    db.commit()
