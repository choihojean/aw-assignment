import jwt
import os
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User
from schemas import UserCreate, Token
from services.auth_service import get_password_hash, verify_password, create_access_token
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from config import SECRET_KEY, ALGORITHM, redis_client, IS_PRODUCTION

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl = "/auth/login")

def get_current_user(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("access_token")  # 쿠키에서 가져옴

    # Authorization 헤더 확인 (없을 경우)
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    print(f"토큰 확인: {token}")  # 👉 디버깅을 위해 추가

    if not token or redis_client.get(token):
        raise HTTPException(status_code=401, detail="토큰이 유효하지 않습니다.")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")

        if username is None:
            raise HTTPException(status_code=401, detail="유효하지 않은 사용자")

        user = db.query(User).filter(User.username == username).first()
        if user is None:
            raise HTTPException(status_code=401, detail="사용자를 찾을 수 없습니다")

        return user

    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="토큰이 유효하지 않습니다")


@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="이미 존재하는 ID입니다")

    hashed_password = get_password_hash(user.password)

    new_user = User(username=user.username, password_hash=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    
    access_token = create_access_token({"sub": new_user.username})

    response = JSONResponse(content={"message": "회원가입이 완료되었습니다.", "access_token": access_token})
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=IS_PRODUCTION,
        samesite="Lax",
        max_age=3600
    )

    return response

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="올바르지 않은 ID나 PASSWORD입니다")
    
    access_token = create_access_token({"sub": user.username})
    
    response = JSONResponse(content={"message": "로그인 성공"})
    response.set_cookie(
        key="access_token", 
        value=access_token, 
        httponly=True, 
        secure=IS_PRODUCTION,  #개발에서는 http 허용하고 배포 시 https만 허용용
        samesite="Lax", 
        max_age=3600  #1시간 유지
    )
    
    return response

@router.post("/logout")
def logout(request: Request):
    token = request.cookies.get("access_token")

    print(f"로그아웃 요청 토큰: {token}")  # 👉 디버깅을 위해 추가

    if not token or redis_client.get(token):
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다.")

    # 토큰을 블랙리스트에 추가 (1시간 동안 무효화)
    redis_client.setex(token, 3600, "blacklisted")

    # 쿠키에서 삭제
    response = JSONResponse(content={"message": "로그아웃 성공"})
    response.delete_cookie("access_token")

    return response


@router.get("/me")
def get_me(request: Request, db: Session = Depends(get_db)):
    # 1. 쿠키에서 access_token 확인
    token = request.cookies.get("access_token")

    # 2. Authorization 헤더에서 access_token 확인
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if not token or redis_client.get(token):
        raise HTTPException(status_code=401, detail="토큰이 유효하지 않습니다")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")

        if username is None:
            raise HTTPException(status_code=401, detail="유효하지 않은 사용자")

        user = db.query(User).filter(User.username == username).first()
        if user is None:
            raise HTTPException(status_code=401, detail="사용자를 찾을 수 없습니다")

        return {"username": user.username, "id": user.id}

    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="토큰이 유효하지 않습니다")
