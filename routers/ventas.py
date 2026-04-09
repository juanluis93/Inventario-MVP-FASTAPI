"""Endpoints de Ventas."""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.database.connection import get_db
from app.schemas.venta import VentaCreate, VentaUpdate, VentaResponse
from app.services import venta_service
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/ventas", tags=["Ventas"])


@router.get("/", response_model=List[VentaResponse])
def listar(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return venta_service.listar_ventas(db, skip, limit)


@router.get("/{venta_id}", response_model=VentaResponse)
def obtener(venta_id: int, db: Session = Depends(get_db)):
    return venta_service.obtener_venta(db, venta_id)


@router.post("/", response_model=VentaResponse, status_code=status.HTTP_201_CREATED)
def crear(data: VentaCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return venta_service.crear_venta(db, data)


@router.patch("/{venta_id}", response_model=VentaResponse)
def editar(venta_id: int, data: VentaUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return venta_service.editar_venta(db, venta_id, data)


@router.post("/{venta_id}/anular", response_model=VentaResponse)
def anular(venta_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return venta_service.anular_venta(db, venta_id)
