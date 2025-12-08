
import os
import json
import uuid
import psycopg2
import pandas as pd
import numpy as np
from scipy.sparse import csr_matrix
from sklearn.metrics.pairwise import cosine_similarity
from mistralai import Mistral
from dataclasses import dataclass
from typing import List, Dict, Any, Optional, Tuple
from config import settings

# ============================================
# 1. DB CONFIG & GLOBALS
# ============================================

# Global state
interactions_df = None
products_df = None
clusters_df = None
user_item_matrix = None
item_sim_matrix = None
user_id_to_idx = {}
idx_to_user_id = {}
product_id_to_idx = {}
idx_to_product_id = {}
product_meta = {}
cluster_meta = {}
MISTRAL_MODEL = "mistral-small-latest"

# We will use the existing Supabase client from database.py
from database import get_supabase

def fetch_data_via_client(table: str, columns: str = "*"):
    """
    Fetch all rows from a table using Supabase client (pagination handled).
    Returns a DataFrame.
    """
    supabase = get_supabase()
    if not supabase:
        raise Exception("Supabase client not initialized")
        
    print(f"[RecEngine] Fetching {table}...")
    all_data = []
    page_size = 1000
    offset = 0
    page_count = 0
    
    while True:
        try:
            # Range is inclusive
            response = supabase.table(table).select(columns).range(offset, offset + page_size - 1).execute()
        except Exception as e:
            print(f"[RecEngine] Error fetching {table} at offset {offset}: {e}")
            break
            
        data = response.data
        if not data:
            break
            
        all_data.extend(data)
        page_count += 1
        if page_count % 5 == 0:  # Log every 5 pages
            print(f"[RecEngine] Fetched {len(all_data)} rows from {table}...")
            
        if len(data) < page_size:
            break
        offset += page_size
        
        # Safety break
        if offset > 50000: 
            print(f"[RecEngine] Reached safety limit for {table}, stopping at {len(all_data)} rows")
            break
            
    print(f"[RecEngine] ✅ Completed fetching {table}: {len(all_data)} total rows")
    return pd.DataFrame(all_data)

# ============================================
# 2. DATA LOADING
# ============================================

INTERACTION_QUERY = """
WITH cart_events AS (
  SELECT 
    user_id,
    product_id,
    CASE 
      WHEN action = 'added' THEN 2.0
      WHEN action = 'quantity_updated' THEN 1.0
      WHEN action = 'removed' THEN 0.0 
      ELSE 0.0
    END AS score
  FROM public.cart_activity_log
),
favorite_events AS (
  SELECT
    user_id,
    product_id,
    CASE
      WHEN action = 'added' THEN 3.0
      WHEN action = 'removed' THEN 0.0
      ELSE 0.0
    END AS score
  FROM public.favorites_activity_log
),
all_events AS (
  SELECT * FROM cart_events
  UNION ALL
  SELECT * FROM favorite_events
)
SELECT
  user_id::text AS user_id,
  product_id::text AS product_id,
  SUM(score) AS interaction_score
FROM all_events
GROUP BY user_id, product_id
HAVING SUM(score) > 0;
"""

PRODUCTS_META_QUERY = """
SELECT
  id::text AS product_id,
  name,
  main_category,
  sub_category,
  image,
  link,
  ratings,
  no_of_ratings,
  discount_price,
  actual_price,
  brand,
  cluster_id,
  add_to_cart,
  buys
FROM public.products;
"""

CLUSTERS_QUERY = """
SELECT
  id AS cluster_id,
  title,
  description,
  product_count,
  created_at
FROM public.clusters;
"""

def refresh_engine_data():
    """
    Loads data from DB, builds matrices, and updates global state.
    Call this on startup and periodically (e.g. background task).
    """
    global interactions_df, products_df, clusters_df
    global user_item_matrix, item_sim_matrix
    global user_id_to_idx, idx_to_user_id, product_id_to_idx, idx_to_product_id
    global product_meta, cluster_meta

    print("[RecEngine] Loading interaction data via Supabase Client...")
    try:
        # 1. Fetch Cart Logs
        print("[RecEngine] Step 1/4: Fetching cart activity logs...")
        cart_df = fetch_data_via_client("cart_activity_log", "user_id, product_id, action")
        
        # 2. Fetch Favorite Logs
        print("[RecEngine] Step 2/4: Fetching favorites activity logs...")
        fav_df = fetch_data_via_client("favorites_activity_log", "user_id, product_id, action")
        
        # 3. Fetch Products
        print("[RecEngine] Step 3/4: Fetching products...")
        products_df = fetch_data_via_client("products", "id, name, main_category, sub_category, image, link, ratings, no_of_ratings, discount_price, actual_price, brand, cluster_id, add_to_cart, buys")
        # Rename id to product_id for consistency
        if not products_df.empty:
            products_df = products_df.rename(columns={"id": "product_id"})
        
        # 4. Fetch Clusters
        print("[RecEngine] Step 4/4: Fetching clusters...")
        clusters_df = fetch_data_via_client("clusters", "id, title, description, product_count")
        # Rename id to cluster_id
        if not clusters_df.empty:
            clusters_df = clusters_df.rename(columns={"id": "cluster_id"})
        
        print("[RecEngine] Processing interaction data...")

        # --- PROCESS INTERACTIONS IN PYTHON ---
        interaction_list = []
        
        # Process Cart
        if not cart_df.empty:
            for _, row in cart_df.iterrows():
                score = 0.0
                if row["action"] == "added": score = 2.0
                elif row["action"] == "quantity_updated": score = 1.0
                elif row["action"] == "removed": score = 0.0
                
                if score > 0:
                    interaction_list.append({
                        "user_id": str(row["user_id"]),
                        "product_id": str(row["product_id"]),
                        "score": score
                    })

        # Process Favorites
        if not fav_df.empty:
            for _, row in fav_df.iterrows():
                score = 0.0
                if row["action"] == "added": score = 3.0
                elif row["action"] == "removed": score = 0.0
                
                if score > 0:
                    interaction_list.append({
                        "user_id": str(row["user_id"]),
                        "product_id": str(row["product_id"]),
                        "score": score
                    })
        
        # Aggregate
        if interaction_list:
            temp_df = pd.DataFrame(interaction_list)
            interactions_df = temp_df.groupby(["user_id", "product_id"], as_index=False)["score"].sum()
            interactions_df = interactions_df[interactions_df["score"] > 0]
            
            # Rename for consistency with original logic
            interactions_df = interactions_df.rename(columns={"score": "interaction_score"})
        else:
            interactions_df = pd.DataFrame(columns=["user_id", "product_id", "interaction_score"])

    except Exception as e:
        print(f"[RecEngine] Error loading/processing data: {e}")
        return

    # Build Mappings
    user_ids = interactions_df["user_id"].unique()
    product_ids = products_df["product_id"].unique()

    user_id_to_idx = {u: i for i, u in enumerate(user_ids)}
    idx_to_user_id = {i: u for u, i in user_id_to_idx.items()}

    product_id_to_idx = {p: i for i, p in enumerate(product_ids)}
    idx_to_product_id = {i: p for p, i in product_id_to_idx.items()}

    # Filter interactions
    interactions_df = interactions_df[interactions_df["product_id"].isin(product_id_to_idx.keys())]

    # Build Matrix
    if len(interactions_df) > 0:
        rows = interactions_df["user_id"].map(user_id_to_idx).values
        cols = interactions_df["product_id"].map(product_id_to_idx).values
        data = interactions_df["interaction_score"].astype(float).values
        
        num_users = len(user_id_to_idx)
        num_items = len(product_id_to_idx)
        
        user_item_matrix = csr_matrix((data, (rows, cols)), shape=(num_users, num_items))
        
        # Compute Sim Matrix
        print("[RecEngine] Computing similarity matrix...")
        item_user_matrix = user_item_matrix.T
        item_sim_matrix = cosine_similarity(item_user_matrix, dense_output=False)
    else:
        print("[RecEngine] No interactions found. Skipping matrix build.")
        user_item_matrix = None
        item_sim_matrix = None

    # Build Metadata Caches
    product_meta = {}
    for _, row in products_df.iterrows():
        product_meta[row["product_id"]] = {
            "name": row["name"],
            "main_category": row["main_category"],
            "sub_category": row["sub_category"],
            "image": row["image"],
            "link": row["link"],
            "ratings": row["ratings"],
            "no_of_ratings": row["no_of_ratings"],
            "discount_price": row["discount_price"],
            "actual_price": row["actual_price"],
            "brand": row["brand"],
            "cluster_id": row["cluster_id"],
            "add_to_cart": row["add_to_cart"],
            "buys": row["buys"],
        }

    cluster_meta = {}
    for _, row in clusters_df.iterrows():
        cluster_meta[int(row["cluster_id"])] = {
            "title": row["title"],
            "description": row["description"],
            "product_count": row["product_count"],
        }
    
    print("[RecEngine] Refresh complete.")

# ============================================
# 3. CORE LOGIC
# ============================================

def get_similar_items(
    product_id: str,
    top_k: int = 20,
    min_score: float = 0.0
) -> List[Tuple[str, float]]:
    if item_sim_matrix is None or product_id not in product_id_to_idx:
        return []
    
    item_idx = product_id_to_idx[product_id]
    sim_row = item_sim_matrix[item_idx].toarray().ravel()
    sim_indices = np.argsort(-sim_row)
    
    results = []
    for idx in sim_indices:
        if idx == item_idx:
            continue
        score = sim_row[idx]
        if score < min_score:
            continue
        results.append((idx_to_product_id[idx], float(score)))
        if len(results) >= top_k:
            break
    return results

def get_user_profile(user_id: str) -> Dict[str, Any]:
    if interactions_df is None or user_id not in user_id_to_idx:
        return {
            "user_id": user_id,
            "history": [],
            "top_clusters": [],
            "persona_hint": "New or cold-start user with very limited behavior."
        }
    
    # Filter global df
    user_interactions = interactions_df[interactions_df["user_id"] == user_id].copy()
    user_interactions = user_interactions.merge(
        products_df[["product_id", "name", "cluster_id", "main_category", "sub_category", "brand"]],
        on="product_id",
        how="left"
    )
    user_interactions = user_interactions.sort_values("interaction_score", ascending=False)
    
    history = []
    for _, row in user_interactions.head(20).iterrows():
        history.append({
            "product_id": row["product_id"],
            "name": row["name"],
            "score": float(row["interaction_score"]),
            "cluster_id": row["cluster_id"],
            "main_category": row["main_category"],
            "sub_category": row["sub_category"],
            "brand": row["brand"],
        })
    
    cluster_counts = user_interactions["cluster_id"].dropna().value_counts().head(5)
    top_clusters = []
    for cid, cnt in cluster_counts.items():
        cm = cluster_meta.get(int(cid), {})
        top_clusters.append({
            "cluster_id": int(cid),
            "title": cm.get("title"),
            "description": cm.get("description"),
            "count": int(cnt)
        })
    
    persona_hint = "User likes products in clusters: " + ", ".join(
        [f"{c['cluster_id']} ({c['title']})" for c in top_clusters]
    ) if len(top_clusters) > 0 else "User behavior sparse; no strong cluster preference detected."
    
    
    return {
        "user_id": user_id,
        "history": history,
        "top_clusters": top_clusters,
        "persona_hint": persona_hint
    }

def get_global_best_sellers(top_k: int = 10) -> List[Tuple[str, float]]:
    """
    Fallback: Get top products by popularity (buys/ratings count).
    """
    if products_df is None or products_df.empty:
        return []
    
    # Calculate simple popularity score
    # Ensure columns exist and are numeric
    try:
        # Create a copy to avoid SettingWithCopy warning
        pop_df = products_df.copy()
        
        # Helper to clean currency/string numbers
        def clean_num(x):
            try:
                if pd.isna(x) or x is None: return 0
                s = str(x).strip()
                if not s: return 0
                # Remove non-digits
                d = ''.join(filter(str.isdigit, s))
                return int(d) if d else 0
            except:
                return 0

        # Ensure correct types before apply
        pop_df["buys"] = pop_df["buys"].astype(str)
        pop_df["no_of_ratings"] = pop_df["no_of_ratings"].astype(str)

        pop_df["clean_buys"] = pop_df["buys"].apply(clean_num)
        pop_df["clean_ratings_count"] = pop_df["no_of_ratings"].apply(clean_num)
        
        pop_df["pop_score"] = (pop_df["clean_buys"] * 0.7) + (pop_df["clean_ratings_count"] * 0.3)
        pop_df = pop_df.sort_values("pop_score", ascending=False).head(top_k)
        
        results = []
        for _, row in pop_df.iterrows():
            results.append((str(row["product_id"]), 0.1)) # Low score to indicate fallback
            
        return results
    except Exception as e:
        print(f"[RecEngine] Fallback calc error: {e}")
        return []

def recommend_for_user_item_cf(
    user_id: str,
    top_k: int = 50
) -> List[Tuple[str, float]]:
    if interactions_df is None or item_sim_matrix is None or user_id not in user_id_to_idx:
        return []
    
    user_interactions = interactions_df[interactions_df["user_id"] == user_id].copy()
    if user_interactions.empty:
        return []
    
    user_interactions["item_idx"] = user_interactions["product_id"].map(product_id_to_idx)
    user_interactions = user_interactions.dropna(subset=["item_idx"])
    
    interacted_indices = user_interactions["item_idx"].astype(int).tolist()
    interacted_scores = user_interactions["interaction_score"].values
    
    user_product_ids = user_interactions["product_id"].tolist()
    user_cluster_ids = [
        product_meta.get(pid, {}).get("cluster_id")
        for pid in user_product_ids
    ]
    user_cluster_ids = [cid for cid in user_cluster_ids if cid is not None]
    cluster_preference = pd.Series(user_cluster_ids).value_counts().to_dict()
    
    candidate_scores = {}
    
    # Limit heavy loop
    max_interactions = 50
    if len(interacted_indices) > max_interactions:
        # Take most recent/strongest
        interacted_indices = interacted_indices[:max_interactions]
        interacted_scores = interacted_scores[:max_interactions]

    for item_idx, ui_score in zip(interacted_indices, interacted_scores):
        sim_row = item_sim_matrix[item_idx].toarray().ravel()
        sim_indices = np.argsort(-sim_row)[::-1] # desc (already handled by argsort default? no, argsort is ascending)
        # Note: argsort sorts ascending. We need desc.
        # In original code: sim_indices = np.argsort(-sim_row) which works
        
        # Let's trust original logic
        sim_indices = np.argsort(-sim_row)

        for idx in sim_indices[:top_k * 4]: 
            if idx in interacted_indices:
                continue
            base_sim = sim_row[idx]
            if base_sim <= 0:
                continue
            
            pid = idx_to_product_id.get(idx)
            if not pid: continue
            
            meta = product_meta.get(pid, {})
            
            buys = meta.get("buys") or 0
            if isinstance(buys, str): buys = 0
            add_to_cart = meta.get("add_to_cart") or 0
            if isinstance(add_to_cart, str): add_to_cart = 0
            
            popularity = np.log1p(float(buys) + 0.5 * float(add_to_cart))
            
            cid = meta.get("cluster_id")
            cluster_boost = 1.0
            if cid is not None and cid in cluster_preference:
                cluster_boost += 0.2 * cluster_preference[cid]
            
            score = float(base_sim * (1.0 + 0.5 * ui_score) * (1.0 + 0.1 * popularity) * cluster_boost)
            
            if pid not in candidate_scores:
                candidate_scores[pid] = 0.0
            candidate_scores[pid] += score
    
    sorted_candidates = sorted(candidate_scores.items(), key=lambda x: x[1], reverse=True)
    return sorted_candidates[:top_k]

# ============================================
# 4. LLM RERANKING
# ============================================

@dataclass
class RankedProduct:
    product_id: str
    score: float
    llm_score: Optional[float] = None
    final_score: Optional[float] = None
    reason: Optional[str] = None
    meta: Optional[Dict[str, Any]] = None

def get_mistral_client() -> Optional[Mistral]:
    if not settings.MISTRAL_API_KEY:
        print("⚠️ [RecEngine] MISTRAL_API_KEY is missing or empty.")
        return None
    # print(f"[RecEngine] Mistral Key Loaded: {settings.MISTRAL_API_KEY[:4]}...****") 
    return Mistral(api_key=settings.MISTRAL_API_KEY)

def build_candidate_payload(
    candidates: List[Tuple[str, float]],
    max_candidates_for_llm: int = 20
) -> List[Dict[str, Any]]:
    payload = []
    for pid, cf_score in candidates[:max_candidates_for_llm]:
        meta = product_meta.get(pid, {})
        payload.append({
            "product_id": pid,
            "cf_score": cf_score,
            "name": meta.get("name"),
            "brand": meta.get("brand"),
            "main_category": meta.get("main_category"),
            "sub_category": meta.get("sub_category"),
            "discount_price": meta.get("discount_price"),
            "actual_price": meta.get("actual_price"),
            "cluster_id": meta.get("cluster_id"),
            "cluster": cluster_meta.get(meta.get("cluster_id"), None),
        })
    return payload

def mistral_rerank(
    user_profile: Dict[str, Any],
    candidates: List[Tuple[str, float]],
    max_candidates_for_llm: int = 20
) -> List[RankedProduct]:
    client = get_mistral_client()
    # Optimize: If client is None OR user history empty, skip? No, keep going.
    
    if client is None:
        return [
            RankedProduct(
                product_id=pid,
                score=cf_score,
                final_score=cf_score,
                meta=product_meta.get(pid, {})
            )
            for pid, cf_score in candidates
        ]
    
    llm_input_candidates = build_candidate_payload(candidates, max_candidates_for_llm)
    
    system_prompt = """
You are a recommendation ranking engine for an e-commerce website.
Your job is to:
1) Re-rank candidate products for a user based on their history and preferences.
2) Output a JSON array only, no extra text.
Each element must be:
{
  "product_id": "...",
  "llm_score": float (0.0 - 1.0),
  "reason": "short natural language explanation"
}
Higher llm_score means more relevant.
    """.strip()
    
    # Strip heavy history to save tokens if needed
    
    user_prompt = {
        "user_profile": user_profile,
        "candidates": llm_input_candidates
    }
    
    try:
        response = client.chat.complete(
            model=MISTRAL_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": json.dumps(user_prompt, default=str),
                },
            ],
        )
        content = response.choices[0].message.content
        llm_results = json.loads(content)
    except Exception as e:
        import traceback
        print(f"[RecEngine] ❌ LLM Request Failed: {e}")
        # traceback.print_exc()
        llm_results = []
    
    llm_map = {}
    if isinstance(llm_results, list):
        for item in llm_results:
            pid = item.get("product_id")
            if not pid: continue
            llm_map[pid] = {
                "llm_score": float(item.get("llm_score", 0.0)),
                "reason": item.get("reason")
            }
            
    ranked: List[RankedProduct] = []
    for pid, cf_score in candidates:
        meta = product_meta.get(pid, {})
        llm_info = llm_map.get(pid, {"llm_score": 0.0, "reason": None})
        llm_score = llm_info["llm_score"]
        
        final_score = 0.7 * (cf_score / (cf_score + 1.0)) + 0.3 * llm_score
        
        # Fallback reason if LLM failed or didn't provide one
        reason = llm_info["reason"]
        if not reason:
            # Generate smart fallback based on metadata
            main_cat = meta.get("main_category")
            if main_cat and main_cat != "None":
                 reason = f"Recommended because you have shown interest in {main_cat} products."
            else:
                 reason = "Recommended based on your recent browsing activity and popular trends."

        ranked.append(
            RankedProduct(
                product_id=pid,
                score=cf_score,
                llm_score=llm_score,
                final_score=final_score,
                reason=reason,
                meta=meta
            )
        )
        
    ranked.sort(key=lambda x: x.final_score if x.final_score is not None else x.score, reverse=True)
    return ranked

# ============================================
# 5. API FACADE
# ============================================

def recommend_for_user_hybrid(
    user_id: str,
    top_k: int = 10
) -> List[Dict[str, Any]]:
    # Auto-init if needed?
    if interactions_df is None:
        print("[RecEngine] Data not loaded, initializing...")
        refresh_engine_data()
        
    cf_candidates = recommend_for_user_item_cf(user_id, top_k=50)
    
    is_fallback = False
    if not cf_candidates:
        print(f"[RecEngine] User {user_id} has no CF candidates (sparse/new user). using fallback.")
        cf_candidates = get_global_best_sellers(top_k=50)
        is_fallback = True
        
    if not cf_candidates:
        return []
    
    profile = get_user_profile(user_id)
    
    # If fallback, tell LLM it's popularity based
    if is_fallback:
        profile["persona_hint"] += " (Using Popular Products Fallback)"
    
    ranked = mistral_rerank(profile, cf_candidates, max_candidates_for_llm=20)
    
    # If LLM failed, we still have candidates
    if not ranked and cf_candidates:
         ranked = [
            RankedProduct(
                product_id=pid,
                score=score,
                final_score=score,
                meta=product_meta.get(pid, {})
            )
            for pid, score in cf_candidates
        ]
    
    # Deduplicate by product_id, keeping the first (highest scored) occurrence
    seen_ids = set()
    unique_ranked = []
    for rp in ranked:
        if rp.product_id not in seen_ids:
            seen_ids.add(rp.product_id)
            unique_ranked.append(rp)
    
    final = []
    for rp in unique_ranked[:top_k]:
        meta = rp.meta or {}
        final.append({
            "product_id": rp.product_id,
            "name": meta.get("name"),
            "brand": meta.get("brand"),
            "main_category": meta.get("main_category"),
            "sub_category": meta.get("sub_category"),
            "image": meta.get("image"),
            "link": meta.get("link"),
            "cluster_id": meta.get("cluster_id"),
            "discount_price": meta.get("discount_price"),
            "actual_price": meta.get("actual_price"),
            "ratings": meta.get("ratings"),
            "cf_score": rp.score,
            "llm_score": rp.llm_score,
            "final_score": rp.final_score,
            "reason": rp.reason,
        })
    return final
