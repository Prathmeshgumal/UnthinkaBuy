"""
UnthinkaBuy FastAPI Backend
Main application entry point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import auth, cart_favorites
import products
from database import get_supabase
from database import get_supabase
from typing import Dict, List
import os

app = FastAPI(
    title="UnthinkaBuy API",
    description="E-commerce API for UnthinkaBuy store",
    version="1.0.0",
    root_path=os.getenv("FASTAPI_ROOT_PATH", ""),
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(products.router, prefix="/api/products", tags=["Products"])
app.include_router(cart_favorites.router, prefix="/api", tags=["Cart & Favorites"])

@app.get("/")
async def root():
    return {"message": "Welcome to UnthinkaBuy API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/api/featured-products")
async def get_featured_products():
    """
    Find top 4 sub_categories with the most number of buys (using no_of_ratings as proxy),
    and from each sub_category find top 2 items based on ratings.
    Returns product IDs organized by sub_category.
    """
    try:
        supabase = get_supabase()
        if not supabase:
            return {"featured_products": {}}
        
        # Fetch all products to analyze
        all_products = []
        page = 0
        page_size = 10000
        has_more = True
        
        while has_more:
            offset = page * page_size
            try:
                result = supabase.table("products").select("id, sub_category, no_of_ratings, ratings").range(offset, offset + page_size - 1).execute()
            except Exception as e:
                print(f"[Featured Products] Error fetching products at page {page}: {str(e)}")
                break
            
            if not result.data or len(result.data) == 0:
                has_more = False
                break
                
            all_products.extend(result.data)
            
            if len(result.data) < page_size:
                has_more = False
            else:
                page += 1
            
            # Safety limit
            if page >= 50:
                break
        
        # Calculate total buys (no_of_ratings) per sub_category
        subcategory_buys = {}
        for product in all_products:
            sub_cat = product.get("sub_category")
            if not sub_cat:
                continue
                
            # Parse no_of_ratings to get number of buys
            ratings_str = product.get("no_of_ratings") or "0"
            # Extract numeric value from string (e.g., "78,970" -> 78970)
            try:
                num_buys = int(''.join(filter(str.isdigit, ratings_str.replace(',', '').replace('₹', ''))))
            except (ValueError, TypeError):
                num_buys = 0
            
            if sub_cat not in subcategory_buys:
                subcategory_buys[sub_cat] = 0
            subcategory_buys[sub_cat] += num_buys
        
        # Get top 4 sub_categories by total buys
        top_subcategories = sorted(
            subcategory_buys.items(),
            key=lambda x: x[1],
            reverse=True
        )[:4]
        
        # For each top sub_category, find top 5 products by rating
        result_data: Dict[str, List[str]] = {}
        
        for sub_category, _ in top_subcategories:
            # Filter products for this sub_category
            category_products = [
                p for p in all_products 
                if p.get("sub_category") == sub_category and p.get("ratings")
            ]
            
            # Sort by rating (descending) and get top 2
            def get_rating(product):
                rating_str = product.get("ratings") or "0"
                try:
                    return float(rating_str)
                except (ValueError, TypeError):
                    return 0.0
            
            sorted_products = sorted(
                category_products,
                key=get_rating,
                reverse=True
            )[:2]
            
            # Extract product IDs
            product_ids = [p["id"] for p in sorted_products]
            result_data[sub_category] = product_ids
        
        return {
            "featured_products": result_data
        }
        
    except Exception as e:
        print(f"Error fetching featured products: {str(e)}")
        return {
            "featured_products": {}
        }

@app.get("/api/discounted-products")
async def get_discounted_products():
    """
    Find products with discount_price below 499 and rating above 4.
    Returns 4 products, one from each main_category.
    Returns product IDs.
    """
    try:
        supabase = get_supabase()
        if not supabase:
            return {"product_ids": []}
        
        # Fetch all products to analyze
        all_products = []
        page = 0
        page_size = 10000
        has_more = True
        
        while has_more:
            offset = page * page_size
            try:
                result = supabase.table("products").select("id, main_category, discount_price, ratings").range(offset, offset + page_size - 1).execute()
            except Exception as e:
                print(f"[Discounted Products] Error fetching products at page {page}: {str(e)}")
                break
            
            if not result.data or len(result.data) == 0:
                has_more = False
                break
                
            all_products.extend(result.data)
            
            if len(result.data) < page_size:
                has_more = False
            else:
                page += 1
            
            # Safety limit
            if page >= 50:
                break
        
        # Filter products: discount_price < 499 and rating > 4
        filtered_products = []
        for product in all_products:
            # Parse discount_price
            price_str = product.get("discount_price") or "0"
            try:
                # Extract numeric value from price string (e.g., "₹499" -> 499)
                price = int(''.join(filter(str.isdigit, price_str.replace(',', '').replace('₹', ''))))
            except (ValueError, TypeError):
                price = 0
            
            # Parse rating
            rating_str = product.get("ratings") or "0"
            try:
                rating = float(rating_str)
            except (ValueError, TypeError):
                rating = 0.0
            
            # Check conditions: price < 499 and rating > 4
            if price > 0 and price < 499 and rating > 4.0:
                filtered_products.append(product)
        
        # Group by main_category and get one product per category
        category_products: Dict[str, List[Dict]] = {}
        for product in filtered_products:
            main_cat = product.get("main_category")
            if not main_cat:
                continue
            
            if main_cat not in category_products:
                category_products[main_cat] = []
            category_products[main_cat].append(product)
        
        # Get one product from each category (prefer higher rating)
        result_products = []
        for main_category, products in category_products.items():
            # Sort by rating descending and take the first one
            sorted_products = sorted(
                products,
                key=lambda p: float(p.get("ratings") or "0"),
                reverse=True
            )
            if sorted_products:
                result_products.append(sorted_products[0]["id"])
        
        # Limit to 4 products
        result_products = result_products[:4]
        
        return {
            "product_ids": result_products
        }
        
    except Exception as e:
        print(f"Error fetching discounted products: {str(e)}")
        return {
            "product_ids": []
        }

@app.get("/api/globally-loved-products")
async def get_globally_loved_products():
    """
    Find products with highest popularity score.
    Score = (no_of_ratings * 0.6) + (no_of_ratings * 0.4)
    Since we use no_of_ratings as proxy for buys, the formula becomes:
    Score = no_of_ratings (weighted the same way)
    Actually, let's use no_of_ratings for both metrics since it represents popularity.
    Returns top 20 product IDs.
    """
    try:
        supabase = get_supabase()
        if not supabase:
            return {"product_ids": []}
        
        # Fetch all products to analyze
        all_products = []
        page = 0
        page_size = 10000
        has_more = True
        
        while has_more:
            offset = page * page_size
            try:
                result = supabase.table("products").select("id, no_of_ratings, ratings").range(offset, offset + page_size - 1).execute()
            except Exception as e:
                print(f"[Globally Loved Products] Error fetching products at page {page}: {str(e)}")
                break
            
            if not result.data or len(result.data) == 0:
                has_more = False
                break
                
            all_products.extend(result.data)
            
            if len(result.data) < page_size:
                has_more = False
            else:
                page += 1
            
            # Safety limit
            if page >= 50:
                break
        
        # Calculate popularity score for each product
        # Score = (buys * 0.6) + (no_of_ratings * 0.4)
        # Using no_of_ratings as proxy for both buys and no_of_ratings
        scored_products = []
        for product in all_products:
            # Parse no_of_ratings (used as proxy for buys)
            buys_str = product.get("no_of_ratings") or "0"
            try:
                buys = int(''.join(filter(str.isdigit, str(buys_str).replace(',', ''))))
            except (ValueError, TypeError):
                buys = 0
            
            # Parse no_of_ratings
            ratings_count_str = product.get("no_of_ratings") or "0"
            try:
                ratings_count = int(''.join(filter(str.isdigit, str(ratings_count_str).replace(',', ''))))
            except (ValueError, TypeError):
                ratings_count = 0
            
            # Calculate weighted score: 60% buys, 40% no_of_ratingscd 
            score = (buys * 0.6) + (ratings_count * 0.4)
            
            scored_products.append({
                "id": product["id"],
                "score": score
            })
        
        # Sort by score descending and get top 20
        scored_products.sort(key=lambda x: x["score"], reverse=True)
        top_20_ids = [p["id"] for p in scored_products[:20]]
        
        return {
            "product_ids": top_20_ids
        }
        
    except Exception as e:
        print(f"Error fetching globally loved products: {str(e)}")
        return {
            "product_ids": []
        }

@app.get("/api/random-cluster-products")
async def get_random_cluster_products():
    """
    Get random products from random clusters.
    Returns ALL products from 4 random clusters (frontend handles pagination for speed).
    """
    import random
    
    try:
        supabase = get_supabase()
        if not supabase:
            print("[Random Cluster Products] Supabase client not available")
            return {"cluster_products": {}, "clusters": [], "debug": "supabase_not_available"}
        
        # Step 1: Fetch all clusters
        try:
            clusters_result = supabase.table("clusters").select("id, title, description, product_count").execute()
            print(f"[Random Cluster Products] Fetched clusters: {clusters_result.data}")
        except Exception as e:
            print(f"[Random Cluster Products] Error fetching clusters: {str(e)}")
            return {"cluster_products": {}, "clusters": [], "debug": f"clusters_error: {str(e)}"}
        
        if not clusters_result.data or len(clusters_result.data) == 0:
            print("[Random Cluster Products] No clusters found in database")
            return {"cluster_products": {}, "clusters": [], "debug": "no_clusters_found"}
        
        all_clusters = clusters_result.data
        
        # Step 2: Randomly select 4 clusters (or all if less than 4)
        num_clusters_to_select = min(4, len(all_clusters))
        selected_clusters = random.sample(all_clusters, num_clusters_to_select)
        
        # Step 3: For each selected cluster, fetch ALL products (frontend will paginate)
        cluster_products = {}
        cluster_info = []
        
        print(f"[Random Cluster Products] Selected {len(selected_clusters)} clusters: {[c['id'] for c in selected_clusters]}")
        
        for cluster in selected_clusters:
            cluster_id = cluster["id"]
            cluster_title = cluster.get("title") or f"Cluster {cluster_id}"
            cluster_description = cluster.get("description") or ""
            
            # Fetch ALL products for this cluster
            try:
                products_result = (
                    supabase.table("products")
                    .select(
                        "id, name, image, ratings, discount_price, actual_price, main_category, sub_category, brand"
                    )
                    .eq("cluster_id", cluster_id)
                    .execute()
                )
                print(
                    f"[Random Cluster Products] Cluster {cluster_id}: found {len(products_result.data) if products_result.data else 0} products"
                )
            except Exception as e:
                print(f"[Random Cluster Products] Error fetching products for cluster {cluster_id}: {str(e)}")
                continue
            
            if not products_result.data or len(products_result.data) == 0:
                print(f"[Random Cluster Products] Cluster {cluster_id}: no products found, skipping")
                continue
            
            # Get all products in cluster
            products_in_cluster = products_result.data
            
            # Shuffle products for variety (only once, on initial load)
            random.shuffle(products_in_cluster)
            
            # Extract ALL product IDs (frontend will handle pagination)
            product_ids = [p["id"] for p in products_in_cluster]
            
            cluster_products[str(cluster_id)] = product_ids
            cluster_info.append({
                "id": cluster_id,
                "title": cluster_title,
                "description": cluster_description,
                "product_ids": product_ids,  # All product IDs
                "total_products": len(product_ids),
                "has_more": len(product_ids) > 5,  # More than initial 5
            })
        
        return {
            "cluster_products": cluster_products,
            "clusters": cluster_info
        }
        
    except Exception as e:
        print(f"Error fetching random cluster products: {str(e)}")
        return {
            "cluster_products": {},
            "clusters": []
        }
