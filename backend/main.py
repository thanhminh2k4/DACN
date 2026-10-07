from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from db import db
from routes import product, user, order, recommend
from security import get_password_hash

app = FastAPI(title="Studyholic API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(product.router, prefix="/api/products", tags=["Products"])
app.include_router(user.router, prefix="/api/users", tags=["Users"])
app.include_router(order.router, prefix="/api/orders", tags=["Orders"])
app.include_router(recommend.router, prefix="/api/ai-recommend", tags=["AI Recommendation"])

@app.on_event("startup")
async def create_super_admin():
    super_admin = await db.users.find_one({"username": "superadmin"})
    if not super_admin:
        await db.users.insert_one({
            "username": "adminSSS",
            "full_name": "Quản trị viên Cấp cao",
            "email": "admin@studyholic.com",
            "password": get_password_hash("babypkmoi01"), 
            "role": "Admin",
            "custom_id": "AD9999", 
            "phone": "0900000000",
            "status": "Không hoạt động",
            "is_super_admin": True 
        })
        print("Đã khởi tạo tài khoản Admin Tổng: adminSSS / babypkmoi01")

@app.get("/")
async def root():
    return {"message": "Backend FastAPI đã chạy thành công!", "status": "200 OK"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)