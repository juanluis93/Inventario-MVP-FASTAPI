"""Endpoints de Productos."""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.database.connection import get_db
from app.schemas.producto import ProductoCreate, ProductoUpdate, ProductoResponse
from app.services import producto_service
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/productos", tags=["Productos"])


@router.get("/", response_model=List[ProductoResponse])
def listar(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return producto_service.listar_productos(db, skip, limit)


@router.get("/{producto_id}", response_model=ProductoResponse)
def obtener(producto_id: int, db: Session = Depends(get_db)):
    return producto_service.obtener_producto(db, producto_id)


@router.post("/", response_model=ProductoResponse, status_code=status.HTTP_201_CREATED)
def crear(data: ProductoCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return producto_service.crear_producto(db, data)


@router.patch("/{producto_id}", response_model=ProductoResponse)
def actualizar(producto_id: int, data: ProductoUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return producto_service.actualizar_producto(db, producto_id, data)


@router.delete("/{producto_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(producto_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    producto_service.eliminar_producto(db, producto_id)
