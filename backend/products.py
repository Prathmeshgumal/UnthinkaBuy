"""
Product routes for fetching products
"""
from fastapi import APIRouter, Query
from typing import Optional

from models import Product, ProductsResponse
from database import get_supabase

router = APIRouter()

@router.get("/", response_model=ProductsResponse)
async def get_products(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category: Optional[str] = None,
    sub_category: Optional[str] = None,
    brand: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    sort: Optional[str] = None,
):
    """
    Get products serially from database, optionally filtered by category, sub_category, brand, and price
    Sort options: 'price_low', 'price_high', or None for default
    """
    try:
        supabase = get_supabase()
        if not supabase:
            return ProductsResponse(products=[], total=0, page=page, limit=limit)
        
        # Calculate offset
        offset = (page - 1) * limit
        
        # Get products serially (ordered by created_at)
        query = supabase.table("products").select("*", count="exact")
        
        # Apply category filter if provided
        if category:
            query = query.eq("main_category", category)
        
        # Apply sub-category filter if provided
        if sub_category:
            query = query.eq("sub_category", sub_category)
        
        # Apply brand filter if provided
        if brand:
            query = query.eq("brand", brand)
        
        # Execute query to get all matching products
        try:
            result = query.order("created_at", desc=False).execute()
        except Exception as e:
            print(f"[Products] Error executing query: {str(e)}")
            return ProductsResponse(products=[], total=0, page=page, limit=limit)
        
        # Filter by price in Python since discount_price is stored as text
        products_data = result.data or []
        if min_price is not None or max_price is not None:
            min_p = min_price if min_price is not None else 0
            max_p = max_price if max_price is not None else float('inf')
            
            filtered_products = []
            for item in products_data:
                price_str = item.get("discount_price") or item.get("actual_price") or "0"
                # Extract numeric value from price string (e.g., "₹1,299" -> 1299)
                try:
                    price = float(''.join(filter(str.isdigit, price_str.replace(',', ''))))
                    if min_p <= price <= max_p:
                        filtered_products.append(item)
                except (ValueError, TypeError):
                    continue
            
            products_data = filtered_products
        
        # Sort by price if requested
        if sort == "price_low" or sort == "price_high":
            def get_price(item):
                price_str = item.get("discount_price") or item.get("actual_price") or "0"
                try:
                    return float(''.join(filter(str.isdigit, price_str.replace(',', ''))))
                except (ValueError, TypeError):
                    return 0.0
            
            products_data.sort(key=get_price, reverse=(sort == "price_high"))
        
        # Apply pagination after filtering and sorting
        total_count = len(products_data)
        paginated_data = products_data[offset:offset + limit]
        
        products = []
        for item in paginated_data:
            products.append(Product(
                id=item["id"],
                name=item["name"],
                main_category=item["main_category"],
                sub_category=item["sub_category"],
                image=item["image"],
                link=item.get("link"),
                ratings=item.get("ratings"),
                no_of_ratings=item.get("no_of_ratings"),
                discount_price=item.get("discount_price"),
                actual_price=item.get("actual_price"),
                brand=item.get("brand")
            ))
        
        return ProductsResponse(
            products=products,
            total=total_count,
            page=page,
            limit=limit
        )
        
    except Exception as e:
        # Log error and return empty list
        print(f"Error fetching products: {str(e)}")
        return ProductsResponse(products=[], total=0, page=page, limit=limit)


@router.get("/{product_id}", response_model=Product)
async def get_product(product_id: str):
    """Get a single product by ID"""
    from fastapi import HTTPException
    
    try:
        supabase = get_supabase()
        if not supabase:
            raise HTTPException(status_code=503, detail="Database not available")
        
        try:
            result = supabase.table("products").select("*").eq("id", product_id).execute()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Product not found")
        
        item = result.data[0]
        return Product(
            id=item["id"],
            name=item["name"],
            main_category=item["main_category"],
            sub_category=item["sub_category"],
            image=item["image"],
            link=item.get("link"),
            ratings=item.get("ratings"),
            no_of_ratings=item.get("no_of_ratings"),
            discount_price=item.get("discount_price"),
            actual_price=item.get("actual_price")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
