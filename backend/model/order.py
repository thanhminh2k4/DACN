from pydantic import BaseModel, Field
from typing import List

class OrderItem(BaseModel):
    product_id: str = Field(..., description="ID của sản phẩm")
    quantity: int = Field(..., gt=0, description="Số lượng đặt mua")

class OrderCreate(BaseModel):
    items: List[OrderItem] = Field(..., description="Danh sách các sản phẩm trong giỏ hàng")