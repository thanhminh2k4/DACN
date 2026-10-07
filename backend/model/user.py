from pydantic import BaseModel, Field

class UserCreate(BaseModel):
    username: str = Field(..., description="Tên đăng nhập")
    email: str = Field(..., description="Email")
    password: str = Field(..., min_length=6, description="Mật khẩu phải có ít nhất 6 ký tự")
    role: str = Field(default="Customer", description="Vai trò: Admin, Staff, Customer")

class UserLogin(BaseModel):
    username: str = Field(..., description="Tên đăng nhập")
    password: str = Field(..., description="Mật khẩu")