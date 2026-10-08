# Tệp: backend/routes/user.py
from fastapi import APIRouter, HTTPException, status, Depends
from model.user import UserCreate, UserLogin, UserUpdateAdmin
from pydantic import BaseModel
from db import db
from security import get_password_hash, verify_password, create_access_token, get_current_user, get_current_admin
from bson.objectid import ObjectId
import random
import string

router = APIRouter()
collection = db.users

# --- BỔ SUNG MÔ HÌNH DỮ LIỆU CHO PROFILE ---
class ProfileUpdate(BaseModel):
    fullname: str = ""
    phone: str = ""
    email: str = ""
    address: str = ""
    avatar_url: str = ""

class PasswordChange(BaseModel):
    old_password: str
    new_password: str
# -------------------------------------------

def generate_custom_id(role: str):
    prefix = "KH" if role == "Customer" else "ST" if role == "Staff" else "AD"
    suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"{prefix}{suffix}"

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(user: UserCreate):
    existing_user = await collection.find_one({"username": user.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Tên đăng nhập đã tồn tại")
    
    user_dict = user.model_dump()
    user_dict["password"] = get_password_hash(user.password)
    user_dict["custom_id"] = generate_custom_id(user.role)
    user_dict["phone"] = "" 
    user_dict["email"] = ""
    user_dict["address"] = ""
    user_dict["avatar_url"] = ""
    user_dict["status"] = "Không hoạt động" 
    
    result = await collection.insert_one(user_dict)
    if result.inserted_id:
        return {"message": "Đăng ký thành công!"}
    raise HTTPException(status_code=500, detail="Lỗi hệ thống")

@router.post("/login")
async def login_user(user: UserLogin):
    db_user = await collection.find_one({"username": user.username})
    if not db_user:
        raise HTTPException(status_code=400, detail="Tên đăng nhập không tồn tại")
    
    if not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=400, detail="Mật khẩu không chính xác")
        
    if db_user.get("status") == "Vô hiệu" and db_user.get("role") != "Admin":
        raise HTTPException(status_code=403, detail="Tài khoản của bạn đã bị vô hiệu hóa.")

    await collection.update_one({"_id": db_user["_id"]}, {"$set": {"status": "Hoạt động"}})
    
    access_token = create_access_token(data={"sub": db_user["username"], "role": db_user["role"]})
    
    ho_va_ten = db_user.get("fullname") or db_user.get("full_name") or db_user.get("name") or db_user.get("ho_ten") or ""

    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "role": db_user["role"],
        "fullname": ho_va_ten,
        "username": db_user.get("username", "")
    }

@router.post("/logout")
async def logout_user(current_user: dict = Depends(get_current_user)):
    await collection.update_one({"username": current_user["username"]}, {"$set": {"status": "Không hoạt động"}})
    return {"message": "Đăng xuất thành công"}

# ================= CÁC API DÀNH CHO PROFILE CÁ NHÂN =================

@router.get("/me")
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    user = await collection.find_one({"username": current_user["username"]}, {"password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    user["_id"] = str(user["_id"])
    return user

@router.put("/update-profile")
async def update_profile(data: ProfileUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    if update_data:
        await collection.update_one({"username": current_user["username"]}, {"$set": update_data})
    return {"message": "Cập nhật thông tin thành công"}

@router.put("/change-password")
async def change_password(data: PasswordChange, current_user: dict = Depends(get_current_user)):
    user = await collection.find_one({"username": current_user["username"]})
    if not verify_password(data.old_password, user["password"]):
        raise HTTPException(status_code=400, detail="Mật khẩu cũ không chính xác")
    
    new_hash = get_password_hash(data.new_password)
    await collection.update_one({"username": current_user["username"]}, {"$set": {"password": new_hash}})
    return {"message": "Đổi mật khẩu thành công"}

# ================= CÁC API DÀNH RIÊNG CHO ADMIN =================

@router.get("/admin/all")
async def get_all_users(current_user: dict = Depends(get_current_admin)):
    users = []
    async for doc in collection.find({}, {"password": 0}):
        doc["_id"] = str(doc["_id"])
        users.append(doc)
    return {"users": users}

@router.post("/admin/create-staff")
async def create_staff_admin(user: UserCreate, current_user: dict = Depends(get_current_admin)):
    if user.role not in ["Staff", "Admin"]:
        raise HTTPException(status_code=400, detail="Chỉ tạo được tài khoản Nhân viên hoặc Quản trị viên")
        
    existing_user = await collection.find_one({"username": user.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Tên đăng nhập đã tồn tại")
        
    user_dict = user.model_dump()
    user_dict["password"] = get_password_hash(user.password)
    user_dict["custom_id"] = generate_custom_id(user.role)
    user_dict["phone"] = "" 
    user_dict["status"] = "Không hoạt động"
    
    await collection.insert_one(user_dict)
    return {"message": f"Tạo tài khoản {user.role} thành công!"}

@router.put("/admin/update/{user_id}")
async def update_user_status_role(user_id: str, data: UserUpdateAdmin, current_user: dict = Depends(get_current_admin)):
    target_user = await collection.find_one({"_id": ObjectId(user_id)})
    if not target_user:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản")

    if target_user.get("is_super_admin"):
        raise HTTPException(status_code=403, detail="Không thể can thiệp vào tài khoản Quản trị viên cấp cao!")

    update_data = {}
    if data.status: 
        update_data["status"] = data.status
    if data.role: 
        update_data["role"] = data.role
        update_data["custom_id"] = generate_custom_id(data.role)
        
    if update_data:
        await collection.update_one({"_id": ObjectId(user_id)}, {"$set": update_data})
        return {"message": "Điều phối tài khoản thành công"}