# Tệp: backend/model/product.py
from pydantic import BaseModel, Field
from typing import Optional
from datetime import date

class ProductModel(BaseModel):
    # CÁC TRƯỜNG HIỆN TẠI (Giữ nguyên không đổi)
    name: str = Field(..., description="Tên đồ dùng học tập")
    category: str = Field(..., description="Danh mục (VD: Bút, Vở, Thước,...)")
    price: int = Field(..., gt=0, description="Giá bán sản phẩm")
    image_url: Optional[str] = Field(None, description="Link ảnh minh họa")
    manufacturer: Optional[str] = Field(default="Đang cập nhật", description="Nhà sản xuất")
    release_date: Optional[str] = Field(default=str(date.today()), description="Ngày lên kệ (YYYY-MM-DD)")
    discount_percent: Optional[int] = Field(default=0, description="Phần trăm giảm giá hiển thị")
    warranty: Optional[str] = Field(default="Không bảo hành", description="Thông tin bảo hành")

    # CÁC TRƯỜNG BỔ SUNG ĐỂ KHỚP VỚI FRONTEND
    product_code: Optional[str] = Field(default="", description="Mã sản phẩm tự động")
    supplier: Optional[str] = Field(default="", description="Nhà cung cấp")
    discount_duration: Optional[int] = Field(default=0, description="Thời gian giảm giá (giờ)")
    stock: Optional[int] = Field(default=1000, description="Số lượng tồn kho")
    description: Optional[str] = Field(default="", description="Mô tả chi tiết sản phẩm")

    class Config:
        json_schema_extra = {
            "example": {
                "product_code": "BUTX9A2",
                "name": "Bút bi Thiên Long",
                "category": "Bút",
                "supplier": "Thiên Long",
                "price": 5000,
                "stock": 100,
                "discount_percent": 10,
                "discount_duration": 72,
                "description": "Bút bi ngòi 0.5mm màu xanh"
            }
        }