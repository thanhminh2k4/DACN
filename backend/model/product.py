# Tệp: backend/model/product.py
from pydantic import BaseModel, Field
from typing import Optional

class ProductModel(BaseModel):
    name: str = Field(..., description="Tên đồ dùng học tập")
    category: str = Field(..., description="Danh mục (VD: Bút, Vở, Thước,...)")
    price: int = Field(..., gt=0, description="Giá bán sản phẩm")
    stock: int = Field(..., ge=0, description="Số lượng tồn kho")
    description: Optional[str] = "Chưa có mô tả"

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Bút bi Thiên Long",
                "category": "Bút",
                "price": 5000,
                "stock": 100,
                "description": "Bút bi ngòi 0.5mm màu xanh"
            }
        }