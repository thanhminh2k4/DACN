# Tệp: backend/routes/order.py
from fastapi import APIRouter, HTTPException, Depends
from model.order import OrderCreate, OrderDirectCreate, OrderUpdateStatus
from db import db
from security import get_current_user, get_admin_or_staff
from bson.objectid import ObjectId
from datetime import datetime
import random
import string
from utils.discount_codes import get_discount_percent 

router = APIRouter()
order_collection = db.orders
product_collection = db.products
cart_collection = db.carts
user_collection = db.users 

def generate_order_id():
    suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
    return f"DH{suffix}"

@router.post("/create")
async def create_order(order: OrderCreate, current_user: dict = Depends(get_current_user)):
    items_to_process = []
    if order.items: 
        items_to_process = [{"product_id": item.product_id, "quantity": item.quantity} for item in order.items]
    else:
        cart = await cart_collection.find_one({"username": current_user["username"]})
        if cart and cart.get("items"):
            items_to_process = cart["items"]
        else:
            raise HTTPException(status_code=400, detail="Giỏ hàng trống hoặc không có sản phẩm")

    total_amount = 0
    order_items_detail = []

    for item in items_to_process:
        try:
            product = await product_collection.find_one({"_id": ObjectId(item["product_id"])})
        except Exception:
            await cart_collection.update_one({"username": current_user["username"]}, {"$pull": {"items": {"product_id": item["product_id"]}}})
            continue 

        if not product:
            await cart_collection.update_one({"username": current_user["username"]}, {"$pull": {"items": {"product_id": item["product_id"]}}})
            continue 
        
        if product.get("stock", 0) < item["quantity"]:
            raise HTTPException(status_code=400, detail=f"Sản phẩm '{product['name']}' không đủ số lượng")

        await product_collection.update_one({"_id": ObjectId(item["product_id"])}, {"$inc": {"stock": -item["quantity"]}})

        item_total = product["price"] * item["quantity"]
        total_amount += item_total

        # LƯU KÈM MÃ SP THEO QUY ƯỚC NGAY LÚC ĐẶT HÀNG
        ma_sp_hien_thi = product.get("custom_id") or product.get("ma_sp") or product.get("product_code") or item["product_id"]

        order_items_detail.append({
            "product_id": item["product_id"],
            "ma_sp_hien_thi": ma_sp_hien_thi,
            "product_name": product["name"],
            "category": product.get("category", "Khác"),
            "quantity": item["quantity"],
            "price": product["price"],
            "image_url": product.get("image_url", ""),
            "item_total": item_total
        })

    if not order_items_detail:
        if not order.items:
            await cart_collection.update_one({"username": current_user["username"]}, {"$set": {"items": []}})
        raise HTTPException(status_code=400, detail="Sản phẩm không tồn tại.")

    discount_code = getattr(order, 'discount_code', None)
    discount_percent = 0
    if discount_code:
        discount_percent = get_discount_percent(discount_code)
        if discount_percent == 0:
            raise HTTPException(status_code=400, detail="Mã giảm giá không hợp lệ!")

    final_amount = total_amount
    if discount_percent > 0:
        discount_amount = total_amount * (discount_percent / 100)
        final_amount = total_amount - discount_amount

    new_order = {
        "order_id": generate_order_id(),
        "username": current_user["username"],
        "items": order_items_detail,
        "total_amount": final_amount, 
        "original_amount": total_amount, 
        "discount_code": discount_code,
        "discount_percent": discount_percent,
        "shipping_address": order.shipping_address,
        "phone": order.phone,
        "payment_method": order.payment_method,
        "status": "Chờ duyệt", 
        "created_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    }

    result = await order_collection.insert_one(new_order)
    if not order.items:
        await cart_collection.update_one({"username": current_user["username"]}, {"$set": {"items": []}})

    if result.inserted_id:
        return {"message": "Thành công", "order_id": new_order["order_id"], "total_amount": final_amount}
    raise HTTPException(status_code=500, detail="Lỗi tạo đơn")

@router.post("/checkout-direct")
async def checkout_direct(order_info: OrderDirectCreate, current_user: dict = Depends(get_current_user)):
    try:
        product = await product_collection.find_one({"_id": ObjectId(order_info.product_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Mã không hợp lệ")

    if not product or product.get("stock", 0) < order_info.quantity:
        raise HTTPException(status_code=400, detail="Sản phẩm không đủ số lượng")

    total_amount = product["price"] * order_info.quantity
    discount_code = getattr(order_info, 'discount_code', None)
    discount_percent = get_discount_percent(discount_code) if discount_code else 0
    final_amount = total_amount - (total_amount * (discount_percent / 100)) if discount_percent > 0 else total_amount

    await product_collection.update_one({"_id": ObjectId(order_info.product_id)}, {"$inc": {"stock": -order_info.quantity}})

    ma_sp_hien_thi = product.get("custom_id") or product.get("ma_sp") or product.get("product_code") or order_info.product_id

    order_items_detail = [{
        "product_id": order_info.product_id,
        "ma_sp_hien_thi": ma_sp_hien_thi,
        "product_name": product["name"],
        "category": product.get("category", "Khác"),
        "quantity": order_info.quantity,
        "price": product["price"],
        "image_url": product.get("image_url", ""),
        "item_total": total_amount
    }]

    new_order = {
        "order_id": generate_order_id(),
        "username": current_user["username"],
        "items": order_items_detail,
        "total_amount": final_amount,
        "original_amount": total_amount,
        "discount_code": discount_code,
        "discount_percent": discount_percent,
        "shipping_address": order_info.shipping_address,
        "phone": order_info.phone,
        "payment_method": order_info.payment_method,
        "status": "Chờ duyệt",
        "created_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    }

    await order_collection.insert_one(new_order)
    return {"message": "Thành công", "order_id": new_order["order_id"], "total_amount": final_amount}

@router.put("/cancel/{id}")
async def cancel_my_order(id: str, current_user: dict = Depends(get_current_user)):
    order = await order_collection.find_one({"_id": ObjectId(id), "username": current_user["username"]})
    if not order or order["status"] != "Chờ duyệt":
        raise HTTPException(status_code=400, detail="Không thể hủy")
    for item in order["items"]:
        await product_collection.update_one({"_id": ObjectId(item["product_id"])}, {"$inc": {"stock": item["quantity"]}})
    await order_collection.update_one({"_id": ObjectId(id)}, {"$set": {"status": "Đã hủy"}})
    return {"message": "Hủy thành công"}

@router.get("/my-orders")
async def get_my_orders(current_user: dict = Depends(get_current_user)):
    orders = []
    async for doc in order_collection.find({"username": current_user["username"]}).sort("created_at", -1):
        doc["_id"] = str(doc["_id"])
        # Lấp đầy thông tin cho các đơn hàng cũ
        for item in doc.get("items", []):
            if "ma_sp_hien_thi" not in item:
                try:
                    prod = await product_collection.find_one({"_id": ObjectId(item["product_id"])})
                    item["ma_sp_hien_thi"] = prod.get("custom_id") or prod.get("ma_sp") or prod.get("product_code") or item["product_id"]
                    item["category"] = prod.get("category", "Khác") if prod else "Không rõ"
                except:
                    item["ma_sp_hien_thi"] = item["product_id"]
        orders.append(doc)
    return {"total_orders": len(orders), "orders": orders}

@router.get("/admin/all")
async def get_all_orders(current_user: dict = Depends(get_admin_or_staff)):
    orders = []
    async for doc in order_collection.find({}).sort("created_at", -1):
        doc["_id"] = str(doc["_id"])
        
        user_info = await user_collection.find_one({"username": doc["username"]})
        if user_info:
            doc["email"] = user_info.get("email", "")
            doc["fullname"] = user_info.get("fullname") or user_info.get("username")
            
        # Lấp đầy thông tin cho các đơn hàng cũ
        for item in doc.get("items", []):
            if "ma_sp_hien_thi" not in item:
                try:
                    prod = await product_collection.find_one({"_id": ObjectId(item["product_id"])})
                    if prod:
                        item["ma_sp_hien_thi"] = prod.get("custom_id") or prod.get("ma_sp") or prod.get("product_code") or item["product_id"]
                        item["category"] = prod.get("category", "Khác")
                    else:
                        item["ma_sp_hien_thi"] = item["product_id"]
                except:
                    item["ma_sp_hien_thi"] = item["product_id"]
                    
        orders.append(doc)
    return {"total_orders": len(orders), "orders": orders}

@router.put("/admin/update/{id}")
async def update_order_status(id: str, data: OrderUpdateStatus, current_user: dict = Depends(get_admin_or_staff)):
    order = await order_collection.find_one({"_id": ObjectId(id)})
    if not order:
        raise HTTPException(status_code=404, detail="Lỗi")

    old_status, new_status = order.get("status"), data.status
    if new_status == "Đã hủy" and old_status != "Đã hủy":
        for item in order["items"]:
            update_fields = {"$inc": {"stock": item["quantity"]}}
            if old_status == "Hoàn thành":
                update_fields["$inc"]["sold"] = -item["quantity"]
            await product_collection.update_one({"_id": ObjectId(item["product_id"])}, update_fields)

    elif new_status == "Hoàn thành" and old_status != "Hoàn thành":
        for item in order["items"]:
            await product_collection.update_one({"_id": ObjectId(item["product_id"])}, {"$inc": {"sold": item["quantity"]}})

    await order_collection.update_one({"_id": ObjectId(id)}, {"$set": {"status": new_status}})
    return {"message": "Thành công"}

@router.get("/validate-discount/{code}")
async def validate_discount_code(code: str):
    discount_percent = get_discount_percent(code)
    if discount_percent > 0: return {"valid": True, "discount_percent": discount_percent, "message": "Hợp lệ"}
    raise HTTPException(status_code=400, detail="Mã không hợp lệ")