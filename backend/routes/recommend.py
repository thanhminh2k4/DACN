from fastapi import APIRouter, HTTPException
from db import db
from services.recommender import get_content_based_recommendations

router = APIRouter()
product_collection = db.products

@router.get("/{product_id}")
async def recommend_products(product_id: str, limit: int = 5):
    try:
        recommendations = await get_content_based_recommendations(
            target_product_id=product_id, 
            collection=product_collection,
            top_n=limit
        )
        return {
            "target_product_id": product_id,
            "recommended_count": len(recommendations),
            "recommendations": recommendations
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi xử lý thuật toán AI: {str(e)}")