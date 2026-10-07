from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

# Tải các biến môi trường (nếu có file .env sau này)
load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")

client = AsyncIOMotorClient(MONGO_URL)

db = client.studyholic_db

print("Đã khởi tạo cấu hình kết nối MongoDB.")