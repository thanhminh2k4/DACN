from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from db import db
from routes import product, user, order, recommend

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

@app.get("/")
async def root():
    return {"message": "Backend FastAPI đã chạy thành công!", "status": "200 OK"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)