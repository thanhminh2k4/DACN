from fastapi import APIRouter, HTTPException, Depends
from model.product import ProductModel
from db import db
from security import get_admin_or_staff
from bson.objectid import ObjectId 

router = APIRouter()
collection = db.products

@router.get("/")
async def get_all_products():
    products = []
    cursor = collection.find({})
    async for document in cursor:
        document["_id"] = str(document["_id"]) 
        products.append(document)
    return {"total": len(products), "products": products}

# Tệp: backend/routes/product.py (Thêm API này vào)
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
    result = await collection.insert_one(product_dict)
    if result.inserted_id:
        return {"message": "Thêm sản phẩm thành công!", "product_id": str(result.inserted_id)}
    raise HTTPException(status_code=400, detail="Không thể thêm sản phẩm")

# API Cập nhật (Sửa) sản phẩm
@router.put("/update/{product_id}")
async def update_product(product_id: str, product: ProductModel, current_user: dict = Depends(get_admin_or_staff)):
    try:
        product_dict = product.model_dump()
        result = await collection.update_one(
            {"_id": ObjectId(product_id)}, 
            {"$set": product_dict}
        )
        if result.modified_count >= 1 or result.matched_count == 1:
            return {"message": "Cập nhật sản phẩm thành công!"}
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm")
    except Exception:
        raise HTTPException(status_code=400, detail="ID sản phẩm không hợp lệ")

# API Xóa sản phẩm
@router.delete("/delete/{product_id}")
async def delete_product(product_id: str, current_user: dict = Depends(get_admin_or_staff)):
    try:
        result = await collection.delete_one({"_id": ObjectId(product_id)})
        if result.deleted_count == 1:
            return {"message": "Xóa sản phẩm thành công!"}
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm để xóa")
    except Exception:
        raise HTTPException(status_code=400, detail="ID sản phẩm không hợp lệ")