"""Configuración de la base de datos."""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

DATABASE_URL = "sqlite:///./inventario.db"
# Para PostgreSQL: "postgresql://user:password@localhost/inventario"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # Solo para SQLite
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """Dependency que provee una sesión de BD."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
