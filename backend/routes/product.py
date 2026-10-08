# Tệp: backend/routes/product.py
from fastapi import APIRouter, HTTPException, Depends
from model.product import ProductModel
from db import db
from security import get_admin_or_staff
from bson.objectid import ObjectId 
from datetime import datetime, timedelta
import pytz # IMPORT THƯ VIỆN XỬ LÝ MÚI GIỜ

router = APIRouter()
collection = db.products
product_collection = db.products

# Khai báo múi giờ Việt Nam
VN_TZ = pytz.timezone('Asia/Ho_Chi_Minh')

@router.get("/")
async def get_all_products():
    products = []
    cursor = collection.find({})
    async for document in cursor:
        document["_id"] = str(document["_id"]) 
        products.append(document)
    return {"total": len(products), "products": products}

@router.get("/{product_id}")
async def get_product_detail(product_id: str):
    try:
        product = await collection.find_one({"_id": ObjectId(product_id)})
        if product:
            product["_id"] = str(product["_id"])
            return product
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm")
    except Exception:
        raise HTTPException(status_code=400, detail="ID không hợp lệ")

@router.post("/add")
async def create_product(product: ProductModel, current_user: dict = Depends(get_admin_or_staff)):
    product_dict = product.model_dump() 
    
    # LOGIC TÍNH GIỜ FLASH SALE VỚI MÚI GIỜ VIỆT NAM
    try:
        discount_percent = float(product_dict.get("discount_percent") or 0)
        discount_hours = float(product_dict.get("discount_hours") or 0)
    except ValueError:
        discount_percent, discount_hours = 0, 0

    if discount_percent > 0 and discount_hours > 0:
        # Lấy giờ Việt Nam hiện tại và cộng thêm số giờ
        now_vn = datetime.now(VN_TZ)
        end_time = now_vn + timedelta(hours=discount_hours)
        product_dict["discount_end_time"] = end_time.isoformat() 
    else:
        product_dict["discount_end_time"] = None

    result = await collection.insert_one(product_dict)
    if result.inserted_id:
        return {"message": "Thêm sản phẩm thành công!", "product_id": str(result.inserted_id)}
    raise HTTPException(status_code=400, detail="Không thể thêm sản phẩm")

@router.put("/update/{product_id}")
async def update_product(product_id: str, product: ProductModel, current_user: dict = Depends(get_admin_or_staff)):
    try:
        product_dict = product.model_dump()
        
        # LOGIC CẬP NHẬT LẠI GIỜ FLASH SALE VỚI MÚI GIỜ VIỆT NAM
        try:
            discount_percent = float(product_dict.get("discount_percent") or 0)
            discount_hours = float(product_dict.get("discount_hours") or 0)
        except ValueError:
            discount_percent, discount_hours = 0, 0
            
        if discount_percent > 0 and discount_hours > 0:
             # Lấy giờ Việt Nam hiện tại và cộng thêm số giờ
            now_vn = datetime.now(VN_TZ)
            end_time = now_vn + timedelta(hours=discount_hours)
            product_dict["discount_end_time"] = end_time.isoformat() 
        elif discount_percent == 0:
            product_dict["discount_end_time"] = None
            
        result = await collection.update_one(
            {"_id": ObjectId(product_id)}, 
            {"$set": product_dict}
        )
        if result.modified_count >= 1 or result.matched_count == 1:
            return {"message": "Cập nhật sản phẩm thành công!"}
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm")
    except Exception:
        raise HTTPException(status_code=400, detail="ID sản phẩm không hợp lệ")

@router.delete("/delete/{product_id}")
async def delete_product(product_id: str, current_user: dict = Depends(get_admin_or_staff)):
    try:
        result = await collection.delete_one({"_id": ObjectId(product_id)})
        if result.deleted_count == 1:
            return {"message": "Xóa sản phẩm thành công!"}
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm để xóa")
    except Exception:
        raise HTTPException(status_code=400, detail="ID sản phẩm không hợp lệ")

@router.put("/{id}/toggle-status")
async def toggle_product_status(id: str, current_user: dict = Depends(get_admin_or_staff)):
    product = await product_collection.find_one({"_id": ObjectId(id)})
    if not product:
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm")

    current_status = product.get("is_active", True)
    new_status = not current_status
    
    await product_collection.update_one(
        {"_id": ObjectId(id)},
        {"$set": {"is_active": new_status}}
    )
    return {"message": "Cập nhật trạng thái thành công", "is_active": new_status}