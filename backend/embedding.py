import os
from dotenv import load_dotenv
from supabase import create_client
from sentence_transformers import SentenceTransformer
from tqdm import tqdm

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Load MiniLM model
model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

def build_text(product):
    return (
        f"{product['name']}. "
        f"Category: {product['main_category']}. "
        f"Subcategory: {product['sub_category']}. "
        f"Brand: {product.get('brand', '')}."
    )

def fetch_products():
    resp = supabase.table("products").select("*").execute()
    return resp.data

def update_embedding(product_id, embedding):
    supabase.table("products") \
        .update({"embedding": embedding.tolist()}) \
        .eq("id", product_id) \
        .execute()

def main():
    print("Fetching products...")
    products = fetch_products()

    for p in tqdm(products):
        text = build_text(p)
        emb = model.encode(text)  # returns numpy array of size 384
        update_embedding(p["id"], emb)

    print("✨ All MiniLM embeddings generated & stored successfully!")

if __name__ == "__main__":
    main()
