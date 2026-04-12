"""Endpoints de autenticacion."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.connection import get_db
from models.usuario import Usuario
from schemas.usuario import UsuarioCreate, UsuarioLogin, UsuarioResponse, Token
from services.auth_service import create_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["Autenticacion"])


@router.post("/register", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def registrar(data: UsuarioCreate, db: Session = Depends(get_db)):
    if db.query(Usuario).filter(Usuario.username == data.username).first():
        raise HTTPException(status_code=400, detail="El usuario ya existe")
    user = Usuario(username=data.username, hashed_password=hash_password(data.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(data: UsuarioLogin, db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.username == data.username).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    token = create_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}
