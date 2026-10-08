# Tệp: backend/model/order.py
from pydantic import BaseModel, Field
from typing import List, Optional

class OrderItem(BaseModel):
    product_id: str = Field(..., description="ID của sản phẩm")
    quantity: int = Field(..., gt=0, description="Số lượng đặt mua")

class OrderCreate(BaseModel):
    items: Optional[List[OrderItem]] = Field(default=None, description="Danh sách các sản phẩm trong giỏ hàng")
    shipping_address: str = Field(..., description="Địa chỉ giao hàng")
    phone: str = Field(..., description="Số điện thoại liên hệ")
    payment_method: str = Field(default="Thanh toán khi nhận hàng (COD)", description="Phương thức thanh toán")
    discount_code: Optional[str] = None

class OrderDirectCreate(BaseModel):
    product_id: str = Field(..., description="ID của sản phẩm")
    quantity: int = Field(..., gt=0, description="Số lượng đặt mua")
    shipping_address: str = Field(..., description="Địa chỉ giao hàng")
    phone: str = Field(..., description="Số điện thoại liên hệ")
    payment_method: str = Field(default="Thanh toán khi nhận hàng (COD)", description="Phương thức thanh toán")
    discount_code: Optional[str] = None
    
class OrderUpdateStatus(BaseModel):
    status: str = Field(..., description="Trạng thái đơn hàng (VD: Chờ duyệt, Đang giao, Hoàn thành, Đã hủy)")