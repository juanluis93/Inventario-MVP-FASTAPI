"""Lógica de negocio para Productos."""
import secrets
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from models.producto import Producto
from schemas.producto import ProductoCreate, ProductoUpdate


def _generar_codigo_unico(db: Session) -> str:
    while True:
        codigo = f"PROD-{secrets.token_hex(4).upper()}"
        existe = db.query(Producto.id).filter(Producto.codigo == codigo).first()
        if not existe:
            return codigo


def listar_productos(db: Session, skip: int = 0, limit: int = 100) -> list[Producto]:
    return db.query(Producto).offset(skip).limit(limit).all()


def obtener_producto(db: Session, producto_id: int) -> Producto:
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
    return producto


def crear_producto(db: Session, data: ProductoCreate) -> Producto:
    payload = data.model_dump()
    payload["codigo"] = _generar_codigo_unico(db)
    producto = Producto(**payload)
    db.add(producto)
    db.commit()
    db.refresh(producto)
    return producto


def actualizar_producto(db: Session, producto_id: int, data: ProductoUpdate) -> Producto:
    producto = obtener_producto(db, producto_id)
    for key, value in data.model_dump(exclude_unset=True).items():
        if key == "codigo":
            continue
        setattr(producto, key, value)
    db.commit()
    db.refresh(producto)
    return producto


def eliminar_producto(db: Session, producto_id: int) -> None:
    producto = obtener_producto(db, producto_id)
    try:
        db.delete(producto)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No se puede eliminar el producto porque tiene ventas asociadas",
        )
