# Tệp: backend/routes/cart.py
from fastapi import APIRouter, HTTPException, Depends
from model.cart import CartItemModel
from db import db
from security import get_current_user
from bson.objectid import ObjectId
from utils.discount_codes import get_discount_percent # Bổ sung import hàm xử lý mã giảm giá

router = APIRouter()
collection = db.carts
product_collection = db.products

@router.get("/")
async def get_cart(discount_code: str = None, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "Customer":
        raise HTTPException(status_code=403, detail="Chỉ Khách hàng mới có giỏ hàng")

    cart = await collection.find_one({"username": current_user["username"]})
    if not cart:
        return {"items": [], "total_price": 0, "final_price": 0, "order_discount_percent": 0}
    
    items = []
    total_price = 0

    for item in cart.get("items", []):
        try:
            product = await product_collection.find_one({"_id": ObjectId(item["product_id"])})
            if product:
                subtotal = product["price"] * item["quantity"]
                total_price += subtotal
                items.append({
                    "product_id": item["product_id"],
                    "name": product["name"],
                    "price": product["price"],
                    "discount_percent": product.get("discount_percent", 0), # Lấy % giảm giá của riêng SP đó
                    "image_url": product.get("image_url", ""),
                    "quantity": item["quantity"],
                    "subtotal": subtotal
                })
        except:
            continue 

    # Tính toán số tiền sau khi áp mã giảm giá cho toàn bộ đơn hàng
    order_discount = 0
    final_price = total_price
    
    if discount_code:
        order_discount = get_discount_percent(discount_code)
        if order_discount > 0:
            discount_amount = total_price * (order_discount / 100)
            final_price = total_price - discount_amount
            
    return {
        "items": items, 
        "total_price": total_price, 
        "final_price": final_price, 
        "order_discount_percent": order_discount
    }

@router.post("/add")
async def add_to_cart(cart_item: CartItemModel, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "Customer":
        raise HTTPException(status_code=403, detail="Chỉ Khách hàng mới có thể mua hàng")

    try:
        product = await product_collection.find_one({"_id": ObjectId(cart_item.product_id)})
        if not product:
            raise HTTPException(status_code=404, detail="Sản phẩm không tồn tại")
    except:
        raise HTTPException(status_code=400, detail="ID sản phẩm không hợp lệ")

    cart = await collection.find_one({"username": current_user["username"]})
    
    if not cart:
        await collection.insert_one({
            "username": current_user["username"],
            "items": [{"product_id": cart_item.product_id, "quantity": cart_item.quantity}]
        })
    else:
        items = cart.get("items", [])
        found = False
        for item in items:
            if item["product_id"] == cart_item.product_id:
                item["quantity"] += cart_item.quantity # Tăng số lượng
                found = True
                break

        if not found:
            items.append({"product_id": cart_item.product_id, "quantity": cart_item.quantity})
        
        await collection.update_one(
            {"username": current_user["username"]},
            {"$set": {"items": items}}
        )
        
    return {"message": "Đã thêm sản phẩm vào giỏ hàng thành công!"}

@router.delete("/remove/{product_id}")
async def remove_from_cart(product_id: str, current_user: dict = Depends(get_current_user)):
    cart = await collection.find_one({"username": current_user["username"]})
    if not cart:
        raise HTTPException(status_code=404, detail="Giỏ hàng trống")
        
    items = [item for item in cart.get("items", []) if item["product_id"] != product_id]
    
    await collection.update_one(
        {"username": current_user["username"]},
        {"$set": {"items": items}}
    )
    return {"message": "Đã xóa sản phẩm khỏi giỏ hàng"}

from pydantic import BaseModel

class CartUpdate(BaseModel):
    product_id: str
    quantity: int

@router.put("/update")
async def update_cart_item(data: CartUpdate, current_user: dict = Depends(get_current_user)):
    if data.quantity <= 0:
        await cart_collection.update_one(
            {"username": current_user["username"]},
            {"$pull": {"items": {"product_id": data.product_id}}}
        )
    else:
        await cart_collection.update_one(
            {"username": current_user["username"], "items.product_id": data.product_id},
            {"$set": {"items.$.quantity": data.quantity}}
        )
    return {"message": "Cập nhật số lượng thành công"}