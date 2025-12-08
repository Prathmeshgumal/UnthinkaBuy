"""
Order events routes for logging Buy Now clicks and order placements.
"""
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from database import get_supabase
from utils.security import verify_token


router = APIRouter()


class OrderEventRequest(BaseModel):
    product_id: str
    event_type: str  # 'buy_now_clicked' or 'order_placed'
    order_id: Optional[str] = None
    metadata: Optional[dict] = None


def get_user_id_from_token(authorization: Optional[str] = Header(None)) -> Optional[str]:
    """
    Extract user ID from JWT token if available.
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None

    token = authorization.split(" ")[1]
    payload = verify_token(token)

    if payload:
        return payload.get("sub")
    return None


@router.post("/order-events")
async def log_order_event(
    event: OrderEventRequest,
    authorization: Optional[str] = Header(None),
):
    """
    Log an order-related event:
    - 'buy_now_clicked' when the user clicks Buy Now
    - 'order_placed' when the user places an order
    """
    try:
        supabase = get_supabase()
        if not supabase:
            raise HTTPException(status_code=503, detail="Database not available")

        # Validate event type
        valid_types = ["buy_now_clicked", "order_placed"]
        if event.event_type not in valid_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid event_type. Must be one of: {valid_types}",
            )

        # Build event data
        data = {
            "product_id": event.product_id,
            "event_type": event.event_type,
            "metadata": event.metadata or {},
            "created_at": datetime.utcnow().isoformat(),
        }

        # Attach user_id if available
        user_id = get_user_id_from_token(authorization)
        if user_id:
            data["user_id"] = user_id

        # Attach order_id if provided
        if event.order_id:
            data["order_id"] = event.order_id

        try:
            result = supabase.table("order_events").insert(data).execute()
        except Exception as e:
            print(f"[OrderEvents] Error inserting order event: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to log order event")

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to log order event")

        return {
            "success": True,
            "message": "Order event logged successfully",
            "id": result.data[0].get("id"),
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[OrderEvents] Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")



