from pydantic import BaseModel
from typing import List

class CartItemModel(BaseModel):
    product_id: str
    quantity: int = 1 