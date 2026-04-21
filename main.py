"""
Sistema de Gestión de Inventario y Ventas
==========================================
Ejecutar: uvicorn app.main:app --reload
Documentación: http://127.0.0.1:8000/docs
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from database.connection import engine, Base
from routers import productos, ventas, auth


def _alinear_tabla_productos() -> None:
    inspector = inspect(engine)
    if "productos" not in inspector.get_table_names():
        return

    columnas = {col["name"] for col in inspector.get_columns("productos")}
    dialect = engine.dialect.name

    with engine.begin() as conn:
        if "categoria" not in columnas:
            conn.execute(text("ALTER TABLE productos ADD COLUMN categoria VARCHAR(50) NOT NULL DEFAULT 'Abarrotes'"))
        if "codigo" not in columnas:
            conn.execute(text("ALTER TABLE productos ADD COLUMN codigo VARCHAR(32)"))
            if dialect == "sqlite":
                conn.execute(text("UPDATE productos SET codigo = 'PROD-' || upper(hex(randomblob(4))) WHERE codigo IS NULL"))
            else:
                conn.execute(text("UPDATE productos SET codigo = concat('PROD-', upper(substring(md5(random()::text), 1, 8))) WHERE codigo IS NULL"))
            conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_productos_codigo ON productos (codigo)"))


def _alinear_tabla_ventas() -> None:
    inspector = inspect(engine)
    if "ventas" not in inspector.get_table_names():
        return

    columnas = {col["name"] for col in inspector.get_columns("ventas")}

    with engine.begin() as conn:
        if "numero_venta" not in columnas:
            conn.execute(text("ALTER TABLE ventas ADD COLUMN numero_venta VARCHAR(30)"))
            conn.execute(text("UPDATE ventas SET numero_venta = 'VEN-' || substr('000000' || id, -6, 6) WHERE numero_venta IS NULL"))
            conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_ventas_numero_venta ON ventas (numero_venta)"))


# Crear tablas al iniciar
Base.metadata.create_all(bind=engine)
_alinear_tabla_productos()
_alinear_tabla_ventas()

app = FastAPI(
    title="Sistema de Gestión de Inventario y Ventas",
    description="API REST para gestionar productos, ventas y stock con autenticación JWT.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth)
app.include_router(productos)
app.include_router(ventas)


@app.get("/", tags=["Root"])
def root():
    return {"message": "Sistema de Inventario y Ventas - Visita /docs para la documentación"}
