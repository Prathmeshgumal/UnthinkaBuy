"""
Cart and Favorites routes for UnthinkaBuy
Handles shopping cart and wishlist functionality
"""
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from database import get_supabase
from utils.security import get_current_user
from models import User

router = APIRouter()

# Request/Response Models
class AddToCartRequest(BaseModel):
    product_id: str
    quantity: int = 1

class UpdateCartQuantityRequest(BaseModel):
    quantity: int

class CartItemResponse(BaseModel):
    id: str
    product_id: str
    quantity: int
    added_at: datetime
    updated_at: datetime
    product: Optional[dict] = None

class FavoriteResponse(BaseModel):
    id: str
    product_id: str
    added_at: datetime
    product: Optional[dict] = None

class ActivityLogResponse(BaseModel):
    id: str
    product_id: str
    action: str
    quantity: Optional[int] = None
    timestamp: datetime

# ==================== CART ENDPOINTS ====================

@router.get("/cart")
async def get_cart(current_user: User = Depends(get_current_user)):
    """Get all items in user's cart with product details"""
    try:
        supabase = get_supabase()
        if not supabase:
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Fetch cart items with product details
        result = supabase.table("cart_items").select(
            "*, products(*)"
        ).eq("user_id", current_user.id).execute()
        
        return {"cart_items": result.data or [], "total_items": len(result.data or [])}
    
    except Exception as e:
        print(f"[Cart] Error fetching cart: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch cart: {str(e)}")

@router.post("/cart")
async def add_to_cart(
    request: AddToCartRequest,
    current_user: User = Depends(get_current_user)
):
    """Add item to cart or update quantity if already exists"""
    try:
        supabase = get_supabase()
        if not supabase:
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Check if item already exists in cart
        existing = supabase.table("cart_items").select("*").eq(
            "user_id", current_user.id
        ).eq("product_id", request.product_id).execute()
        
        if existing.data:
            # Update existing item
            new_quantity = existing.data[0]["quantity"] + request.quantity
            result = supabase.table("cart_items").update({
                "quantity": new_quantity
            }).eq("id", existing.data[0]["id"]).execute()
            
            # Log activity
            supabase.table("cart_activity_log").insert({
                "user_id": current_user.id,
                "product_id": request.product_id,
                "action": "quantity_updated",
                "quantity": new_quantity
            }).execute()
            
            return {"message": "Cart updated", "item": result.data[0]}
        else:
            # Insert new item
            result = supabase.table("cart_items").insert({
                "user_id": current_user.id,
                "product_id": request.product_id,
                "quantity": request.quantity
            }).execute()
            
            # Log activity
            supabase.table("cart_activity_log").insert({
                "user_id": current_user.id,
                "product_id": request.product_id,
                "action": "added",
                "quantity": request.quantity
            }).execute()
            
            return {"message": "Item added to cart", "item": result.data[0]}
    
    except Exception as e:
        print(f"[Cart] Error adding to cart: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to add to cart: {str(e)}")

@router.put("/cart/{product_id}")
async def update_cart_quantity(
    product_id: str,
    request: UpdateCartQuantityRequest,
    current_user: User = Depends(get_current_user)
):
    """Update quantity of a cart item"""
    try:
        supabase = get_supabase()
        if not supabase:
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        if request.quantity <= 0:
            raise HTTPException(status_code=400, detail="Quantity must be positive")
        
        # Update cart item
        result = supabase.table("cart_items").update({
            "quantity": request.quantity
        }).eq("user_id", current_user.id).eq("product_id", product_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Cart item not found")
        
        # Log activity
        supabase.table("cart_activity_log").insert({
            "user_id": current_user.id,
            "product_id": product_id,
            "action": "quantity_updated",
            "quantity": request.quantity
        }).execute()
        
        return {"message": "Quantity updated", "item": result.data[0]}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Cart] Error updating quantity: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update quantity: {str(e)}")

@router.delete("/cart/{product_id}")
async def remove_from_cart(
    product_id: str,
    current_user: User = Depends(get_current_user)
):
    """Remove item from cart"""
    try:
        supabase = get_supabase()
        if not supabase:
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Delete cart item
        result = supabase.table("cart_items").delete().eq(
            "user_id", current_user.id
        ).eq("product_id", product_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Cart item not found")
        
        # Log activity
        supabase.table("cart_activity_log").insert({
            "user_id": current_user.id,
            "product_id": product_id,
            "action": "removed"
        }).execute()
        
        return {"message": "Item removed from cart"}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Cart] Error removing from cart: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to remove from cart: {str(e)}")

@router.delete("/cart")
async def clear_cart(current_user: User = Depends(get_current_user)):
    """Clear all items from cart"""
    try:
        supabase = get_supabase()
        if not supabase:
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Delete all cart items for user
        result = supabase.table("cart_items").delete().eq("user_id", current_user.id).execute()
        
        return {"message": "Cart cleared", "items_removed": len(result.data or [])}
    
    except Exception as e:
        print(f"[Cart] Error clearing cart: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to clear cart: {str(e)}")

@router.get("/cart/activity")
async def get_cart_activity(current_user: User = Depends(get_current_user)):
    """Get cart activity history for user"""
    try:
        supabase = get_supabase()
        if not supabase:
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        result = supabase.table("cart_activity_log").select(
            "*, products(name, image)"
        ).eq("user_id", current_user.id).order("timestamp", desc=True).limit(50).execute()
        
        return {"activity": result.data or []}
    
    except Exception as e:
        print(f"[Cart] Error fetching activity: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch activity: {str(e)}")

# ==================== FAVORITES ENDPOINTS ====================

@router.get("/favorites")
async def get_favorites(current_user: User = Depends(get_current_user)):
    """Get all favorite items with product details"""
    try:
        supabase = get_supabase()
        if not supabase:
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Fetch favorites with product details
        result = supabase.table("favorites").select(
            "*, products(*)"
        ).eq("user_id", current_user.id).order("added_at", desc=True).execute()
        
        return {"favorites": result.data or [], "total": len(result.data or [])}
    
    except Exception as e:
        print(f"[Favorites] Error fetching favorites: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch favorites: {str(e)}")

@router.post("/favorites/{product_id}")
async def add_to_favorites(
    product_id: str,
    current_user: User = Depends(get_current_user)
):
    """Add item to favorites"""
    try:
        supabase = get_supabase()
        if not supabase:
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Check if already favorited
        existing = supabase.table("favorites").select("*").eq(
            "user_id", current_user.id
        ).eq("product_id", product_id).execute()
        
        if existing.data:
            return {"message": "Item already in favorites", "favorite": existing.data[0]}
        
        # Insert new favorite
        result = supabase.table("favorites").insert({
            "user_id": current_user.id,
            "product_id": product_id
        }).execute()
        
        # Log activity
        supabase.table("favorites_activity_log").insert({
            "user_id": current_user.id,
            "product_id": product_id,
            "action": "added"
        }).execute()
        
        return {"message": "Item added to favorites", "favorite": result.data[0]}
    
    except Exception as e:
        print(f"[Favorites] Error adding to favorites: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to add to favorites: {str(e)}")

@router.delete("/favorites/{product_id}")
async def remove_from_favorites(
    product_id: str,
    current_user: User = Depends(get_current_user)
):
    """Remove item from favorites"""
    try:
        supabase = get_supabase()
        if not supabase:
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Delete favorite
        result = supabase.table("favorites").delete().eq(
            "user_id", current_user.id
        ).eq("product_id", product_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Favorite not found")
        
        # Log activity
        supabase.table("favorites_activity_log").insert({
            "user_id": current_user.id,
            "product_id": product_id,
            "action": "removed"
        }).execute()
        
        return {"message": "Item removed from favorites"}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Favorites] Error removing from favorites: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to remove from favorites: {str(e)}")

@router.get("/favorites/activity")
async def get_favorites_activity(current_user: User = Depends(get_current_user)):
    """Get favorites activity history for user"""
    try:
        supabase = get_supabase()
        if not supabase:
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        result = supabase.table("favorites_activity_log").select(
            "*, products(name, image)"
        ).eq("user_id", current_user.id).order("timestamp", desc=True).limit(50).execute()
        
        return {"activity": result.data or []}
    
    except Exception as e:
        print(f"[Favorites] Error fetching activity: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch activity: {str(e)}")

@router.get("/favorites/check/{product_id}")
async def check_if_favorited(
    product_id: str,
    current_user: User = Depends(get_current_user)
):
    """Check if a product is in user's favorites"""
    try:
        supabase = get_supabase()
        if not supabase:
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        result = supabase.table("favorites").select("id").eq(
            "user_id", current_user.id
        ).eq("product_id", product_id).execute()
        
        return {"is_favorited": len(result.data or []) > 0}
    
    except Exception as e:
        print(f"[Favorites] Error checking favorite: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to check favorite: {str(e)}")

