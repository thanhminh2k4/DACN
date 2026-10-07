from fastapi import APIRouter, HTTPException, Depends
from model.order import OrderCreate
from db import db
from security import get_current_user
from bson.objectid import ObjectId
from datetime import datetime

router = APIRouter()
order_collection = db.orders
product_collection = db.products

@router.post("/create")
async def create_order(order: OrderCreate, current_user: dict = Depends(get_current_user)):
    total_amount = 0
    order_items_detail = []

    for item in order.items:
        try:
            product = await product_collection.find_one({"_id": ObjectId(item.product_id)})
        except Exception:
            raise HTTPException(status_code=400, detail=f"Mã sản phẩm {item.product_id} không hợp lệ")

        if not product:
            raise HTTPException(status_code=404, detail=f"Sản phẩm {item.product_id} không tồn tại")
        
        if product.get("stock", 0) < item.quantity:
            raise HTTPException(status_code=400, detail=f"Sản phẩm '{product['name']}' không đủ số lượng trong kho")

        await product_collection.update_one(
            {"_id": ObjectId(item.product_id)},
            {"$inc": {"stock": -item.quantity}}
        )

        item_total = product["price"] * item.quantity
        total_amount += item_total

        order_items_detail.append({
            "product_id": item.product_id,
            "product_name": product["name"],
            "quantity": item.quantity,
            "price": product["price"],
            "item_total": item_total
        })

    new_order = {
        "username": current_user["username"],
        "items": order_items_detail,
        "total_amount": total_amount,
        "status": "Pending", 
        "created_at": datetime.utcnow()
    }

    result = await order_collection.insert_one(new_order)
    
    if result.inserted_id:
        return {
            "message": "Đặt hàng thành công", 
            "order_id": str(result.inserted_id),
            "total_amount": total_amount
        }
    raise HTTPException(status_code=500, detail="Không thể tạo đơn hàng")

@router.get("/my-orders")
async def get_my_orders(current_user: dict = Depends(get_current_user)):
    orders = []
    cursor = order_collection.find({"username": current_user["username"]})
    async for document in cursor:
        document["_id"] = str(document["_id"])
        orders.append(document)
    
    return {"total_orders": len(orders), "orders": orders}