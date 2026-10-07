# Tệp: backend/routes/user.py
from fastapi import APIRouter, HTTPException, status
from model.user import UserCreate, UserLogin
from db import db
from security import get_password_hash, verify_password, create_access_token

router = APIRouter()
collection = db.users 

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(user: UserCreate):
    existing_user = await collection.find_one({"username": user.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Tên đăng nhập đã tồn tại")

    hashed_password = get_password_hash(user.password)
    user_dict = user.model_dump()
    user_dict["password"] = hashed_password 
    
    result = await collection.insert_one(user_dict)
    if result.inserted_id:
        return {"message": "Đăng ký thành công!", "user_id": str(result.inserted_id)}
    raise HTTPException(status_code=500, detail="Lỗi hệ thống khi đăng ký")

@router.post("/login")
async def login_user(user: UserLogin):
    db_user = await collection.find_one({"username": user.username})
    if not db_user:
        raise HTTPException(status_code=400, detail="Tên đăng nhập không tồn tại")
    
    if not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=400, detail="Mật khẩu không chính xác")
    
    access_token = create_access_token(
        data={"sub": db_user["username"], "role": db_user["role"]}
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "role": db_user["role"]
    }