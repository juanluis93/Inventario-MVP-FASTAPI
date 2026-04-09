"""
Sistema de Gestión de Inventario y Ventas
==========================================
Ejecutar: uvicorn app.main:app --reload
Documentación: http://127.0.0.1:8000/docs
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.connection import engine, Base
from app.routers import productos, ventas, auth

# Crear tablas al iniciar
Base.metadata.create_all(bind=engine)

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

app.include_router(auth.router)
app.include_router(productos.router)
app.include_router(ventas.router)


@app.get("/", tags=["Root"])
def root():
    return {"message": "Sistema de Inventario y Ventas - Visita /docs para la documentación"}
