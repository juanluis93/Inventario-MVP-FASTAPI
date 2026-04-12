"""Lógica de negocio para Ventas."""
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from models.venta import Venta, EstadoVenta
from models.detalle_venta import DetalleVenta
from models.producto import Producto
from schemas.venta import VentaCreate, VentaUpdate


def _validar_y_preparar_detalles(db: Session, detalles_data) -> list[dict]:
    """Valida stock y prepara los detalles de venta."""
    items = []
    for d in detalles_data:
        producto = db.query(Producto).filter(Producto.id == d.producto_id).first()
        if not producto:
            raise HTTPException(status_code=404, detail=f"Producto {d.producto_id} no encontrado")
        if producto.stock < d.cantidad:
            raise HTTPException(
                status_code=400,
                detail=f"Stock insuficiente para '{producto.nombre}'. Disponible: {producto.stock}, solicitado: {d.cantidad}",
            )
        items.append({"producto": producto, "cantidad": d.cantidad})
    return items


def crear_venta(db: Session, data: VentaCreate) -> Venta:
    """Registra una venta, calcula el total y reduce stock."""
    items = _validar_y_preparar_detalles(db, data.detalles)

    venta = Venta(total=0)
    db.add(venta)
    db.flush()  # Obtener ID

    total = 0.0
    for item in items:
        producto = item["producto"]
        cantidad = item["cantidad"]
        subtotal = producto.precio * cantidad
        total += subtotal

        detalle = DetalleVenta(
            venta_id=venta.id,
            producto_id=producto.id,
            cantidad=cantidad,
            precio_unitario=producto.precio,
        )
        db.add(detalle)

        # Reducir stock
        producto.stock -= cantidad

    venta.total = round(total, 2)
    db.commit()
    db.refresh(venta)
    return venta


def listar_ventas(db: Session, skip: int = 0, limit: int = 100) -> list[Venta]:
    return db.query(Venta).offset(skip).limit(limit).all()


def obtener_venta(db: Session, venta_id: int) -> Venta:
    venta = db.query(Venta).filter(Venta.id == venta_id).first()
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    return venta


def editar_venta(db: Session, venta_id: int, data: VentaUpdate) -> Venta:
    """Edita una venta activa: devuelve stock anterior, aplica nuevos detalles."""
    venta = obtener_venta(db, venta_id)
    if venta.estado == EstadoVenta.ANULADA:
        raise HTTPException(status_code=400, detail="No se puede editar una venta anulada")

    if data.detalles is not None:
        # Devolver stock de detalles anteriores
        for detalle in venta.detalles:
            producto = db.query(Producto).filter(Producto.id == detalle.producto_id).first()
            if producto:
                producto.stock += detalle.cantidad
            db.delete(detalle)

        # Validar y crear nuevos detalles
        items = _validar_y_preparar_detalles(db, data.detalles)
        total = 0.0
        for item in items:
            producto = item["producto"]
            cantidad = item["cantidad"]
            subtotal = producto.precio * cantidad
            total += subtotal
            detalle = DetalleVenta(
                venta_id=venta.id,
                producto_id=producto.id,
                cantidad=cantidad,
                precio_unitario=producto.precio,
            )
            db.add(detalle)
            producto.stock -= cantidad

        venta.total = round(total, 2)

    db.commit()
    db.refresh(venta)
    return venta


def anular_venta(db: Session, venta_id: int) -> Venta:
    """Anula una venta y devuelve el stock de los productos."""
    venta = obtener_venta(db, venta_id)
    if venta.estado == EstadoVenta.ANULADA:
        raise HTTPException(status_code=400, detail="La venta ya está anulada")

    for detalle in venta.detalles:
        producto = db.query(Producto).filter(Producto.id == detalle.producto_id).first()
        if producto:
            producto.stock += detalle.cantidad

    venta.estado = EstadoVenta.ANULADA
    db.commit()
    db.refresh(venta)
    return venta
