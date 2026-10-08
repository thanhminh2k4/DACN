# Tệp: backend/routes/order.py
from fastapi import APIRouter, HTTPException, Depends
from model.order import OrderCreate, OrderDirectCreate, OrderUpdateStatus
from db import db
from security import get_current_user, get_admin_or_staff
from bson.objectid import ObjectId
from datetime import datetime
import random
import string

router = APIRouter()
order_collection = db.orders
product_collection = db.products
cart_collection = db.carts # Bổ sung collection giỏ hàng

# Hàm sinh mã đơn hàng (VD: DH1A2B)
def generate_order_id():
    suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
    return f"DH{suffix}"

# 1. TẠO ĐƠN HÀNG (Từ Giỏ hàng hoặc truyển trực tiếp danh sách items)
@router.post("/create")
async def create_order(order: OrderCreate, current_user: dict = Depends(get_current_user)):
    # Xác định danh sách sản phẩm cần thanh toán
    items_to_process = []
    
    if order.items: 
        # Nếu gửi danh sách items lên (Mua nhiều sản phẩm trực tiếp)
        items_to_process = [{"product_id": item.product_id, "quantity": item.quantity} for item in order.items]
    else:
        # Nếu không gửi items, hệ thống tự động lấy từ Giỏ hàng của user
        cart = await cart_collection.find_one({"username": current_user["username"]})
        if cart and cart.get("items"):
            items_to_process = cart["items"]
        else:
            raise HTTPException(status_code=400, detail="Giỏ hàng trống hoặc không có sản phẩm để thanh toán")

    total_amount = 0
    order_items_detail = []

    for item in items_to_process:
        try:
            product = await product_collection.find_one({"_id": ObjectId(item["product_id"])})
        except Exception:
            raise HTTPException(status_code=400, detail=f"Mã sản phẩm {item['product_id']} không hợp lệ")

        if not product:
            raise HTTPException(status_code=404, detail=f"Sản phẩm {item['product_id']} không tồn tại")
        
        if product.get("stock", 0) < item["quantity"]:
            raise HTTPException(status_code=400, detail=f"Sản phẩm '{product['name']}' không đủ số lượng trong kho")

        # Trừ tồn kho
        await product_collection.update_one(
            {"_id": ObjectId(item["product_id"])},
            {"$inc": {"stock": -item["quantity"]}}
        )

        item_total = product["price"] * item["quantity"]
        total_amount += item_total

        order_items_detail.append({
            "product_id": item["product_id"],
            "product_name": product["name"],
            "quantity": item["quantity"],
            "price": product["price"],
            "image_url": product.get("image_url", ""),
            "item_total": item_total
        })

    new_order = {
        "order_id": generate_order_id(),
        "username": current_user["username"],
        "items": order_items_detail,
        "total_amount": total_amount,
        "shipping_address": order.shipping_address,
        "phone": order.phone,
        "payment_method": order.payment_method,
        "status": "Chờ duyệt", 
        "created_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    }

    result = await order_collection.insert_one(new_order)
    
    # Nếu thanh toán từ giỏ hàng, hãy xóa trống giỏ hàng sau khi đặt thành công
    if not order.items:
        await cart_collection.update_one({"username": current_user["username"]}, {"$set": {"items": []}})

    if result.inserted_id:
        return {
            "message": "Đặt hàng thành công", 
            "order_id": new_order["order_id"],
            "total_amount": total_amount
        }
    raise HTTPException(status_code=500, detail="Không thể tạo đơn hàng")

# 2. MUA NGAY 1 SẢN PHẨM (Bấm nút Mua ngay trên trang chi tiết)
@router.post("/checkout-direct")
async def checkout_direct(order_info: OrderDirectCreate, current_user: dict = Depends(get_current_user)):
    try:
        product = await product_collection.find_one({"_id": ObjectId(order_info.product_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Mã sản phẩm không hợp lệ")

    if not product:
        raise HTTPException(status_code=404, detail="Sản phẩm không tồn tại")

    if product.get("stock", 0) < order_info.quantity:
        raise HTTPException(status_code=400, detail=f"Sản phẩm '{product['name']}' không đủ số lượng trong kho")

    total_amount = product["price"] * order_info.quantity

    # Trừ kho
    await product_collection.update_one(
        {"_id": ObjectId(order_info.product_id)},
        {"$inc": {"stock": -order_info.quantity}}
    )

    order_items_detail = [{
        "product_id": order_info.product_id,
        "product_name": product["name"],
        "quantity": order_info.quantity,
        "price": product["price"],
        "image_url": product.get("image_url", ""),
        "item_total": total_amount
    }]

    new_order = {
        "order_id": generate_order_id(),
        "username": current_user["username"],
        "items": order_items_detail,
        "total_amount": total_amount,
        "shipping_address": order_info.shipping_address,
        "phone": order_info.phone,
        "payment_method": order_info.payment_method,
        "status": "Chờ duyệt",
        "created_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    }

    await order_collection.insert_one(new_order)
    return {
        "message": "Đặt hàng thành công", 
        "order_id": new_order["order_id"],
        "total_amount": total_amount
    }

# 3. KHÁCH HÀNG: Lịch sử đơn hàng
@router.get("/my-orders")
async def get_my_orders(current_user: dict = Depends(get_current_user)):
    orders = []
    # Sắp xếp mới nhất lên đầu (theo created_at)
    cursor = order_collection.find({"username": current_user["username"]}).sort("created_at", -1)
    async for document in cursor:
        document["_id"] = str(document["_id"])
        orders.append(document)
    
    return {"total_orders": len(orders), "orders": orders}

# 4. ADMIN/STAFF: Xem toàn bộ đơn hàng
@router.get("/admin/all")
async def get_all_orders(current_user: dict = Depends(get_admin_or_staff)):
    orders = []
    cursor = order_collection.find({}).sort("created_at", -1)
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        orders.append(doc)
    return {"total_orders": len(orders), "orders": orders}

# 5. ADMIN/STAFF: Cập nhật trạng thái đơn (Có hoàn kho)
@router.put("/admin/update/{id}")
async def update_order_status(id: str, data: OrderUpdateStatus, current_user: dict = Depends(get_admin_or_staff)):
    order = await order_collection.find_one({"_id": ObjectId(id)})
    if not order:
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng")

    # TỰ ĐỘNG HOÀN KHO NẾU HỦY ĐƠN
    if data.status == "Đã hủy" and order["status"] != "Đã hủy":
        for item in order["items"]:
            await product_collection.update_one(
                {"_id": ObjectId(item["product_id"])},
                {"$inc": {"stock": item["quantity"]}}
            )

    await order_collection.update_one({"_id": ObjectId(id)}, {"$set": {"status": data.status}})
    return {"message": "Cập nhật trạng thái thành công"}