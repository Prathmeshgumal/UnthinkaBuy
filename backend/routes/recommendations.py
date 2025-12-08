from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List, Optional
from pydantic import BaseModel

from rec_engine.engine import recommend_for_user_hybrid, refresh_engine_data

router = APIRouter()

class RecommendationResponse(BaseModel):
    id: str
    name: Optional[str] = None
    brand: Optional[str] = None
    main_category: Optional[str] = None
    sub_category: Optional[str] = None
    image: Optional[str] = None
    price: Optional[str] = None # Using display price
    discount_price: Optional[str] = None
    actual_price: Optional[str] = None
    ratings: Optional[str] = None
    reason: Optional[str] = None
    match_score: float

@router.get("/recommendations/user/{user_id}", response_model=List[RecommendationResponse])
async def get_user_recommendations(user_id: str, limit: int = 10):
    """
    Get hybrid recommendations for a user.
    """
    try:
        print(f"[API] Getting recommendations for user: {user_id}, limit: {limit}")
        recs = recommend_for_user_hybrid(user_id, top_k=limit)
        print(f"[API] Engine returned {len(recs)} recommendations")
        
        # Deduplicate by product_id as a safety measure
        seen_ids = set()
        unique_recs = []
        for r in recs:
            product_id = str(r.get("product_id", ""))
            if product_id and product_id not in seen_ids:
                seen_ids.add(product_id)
                unique_recs.append(r)
        
        print(f"[API] Deduplicated to {len(unique_recs)} unique recommendations")
        
        results = []
        for r in unique_recs:
            try:
                results.append(RecommendationResponse(
                    id=str(r.get("product_id", "")),
                    name=r.get("name") or "",
                    brand=r.get("brand"),
                    main_category=r.get("main_category"),
                    sub_category=r.get("sub_category"),
                    image=r.get("image") or "",
                    discount_price=r.get("discount_price"),
                    actual_price=r.get("actual_price"),
                    ratings=r.get("ratings"),
                    reason=r.get("reason"),
                    match_score=float(r.get("final_score", 0.0))
                ))
            except Exception as item_error:
                print(f"[API] Error formatting recommendation item: {item_error}")
                print(f"[API] Item data: {r}")
                continue  # Skip this item and continue with others
        
        print(f"[API] Returning {len(results)} formatted recommendations")
        return results
    except Exception as e:
        import traceback
        print(f"[API] Rec Error: {e}")
        traceback.print_exc()
        # Return empty list on error to not break frontend
        return []

@router.post("/recommendations/refresh")
async def refresh_recommendations(background_tasks: BackgroundTasks):
    """
    Trigger a refresh of the recommendation engine data.
    """
    background_tasks.add_task(refresh_engine_data)
    return {"status": "refresh_started"}
