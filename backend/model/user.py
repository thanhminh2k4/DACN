from pydantic import BaseModel, Field
from typing import Optional

class UserCreate(BaseModel):
    username: str = Field(..., description="Tên đăng nhập")
    full_name: str = Field(..., description="Họ và tên")
    email: str = Field(..., description="Địa chỉ email")
    password: str = Field(..., min_length=6, description="Mật khẩu phải có ít nhất 6 ký tự")
    role: str = Field(default="Customer", description="Vai trò: Admin, Staff, Customer")

class UserLogin(BaseModel):
    username: str = Field(..., description="Tên đăng nhập")
    password: str = Field(..., description="Mật khẩu")

class UserUpdateAdmin(BaseModel):
    role: Optional[str] = None
    status: Optional[str] = None