# Tệp: backend/routes/product.py
from fastapi import APIRouter, HTTPException, Depends
from model.product import ProductModel
from db import db
from security import get_admin_or_staff

router = APIRouter()
collection = db.products 

@router.post("/add")
async def create_product(product: ProductModel, current_user: dict = Depends(get_admin_or_staff)):
    product_dict = product.model_dump() 
    result = await collection.insert_one(product_dict)
    
    if result.inserted_id:
        return {
            "message": "Thêm sản phẩm thành công!", 
            "product_id": str(result.inserted_id),
            "added_by": current_user["username"] 
        }
    raise HTTPException(status_code=400, detail="Không thể thêm sản phẩm")

@router.get("/")
async def get_all_products():
    products = []
    cursor = collection.find({})
    
    async for document in cursor:
        document["_id"] = str(document["_id"]) 
        products.append(document)
        
    return {"total": len(products), "products": products}