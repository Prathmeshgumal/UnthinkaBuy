
import asyncio
import os
from dotenv import load_dotenv

# Load env before imports
load_dotenv()

from rec_engine.engine import refresh_engine_data, recommend_for_user_hybrid, interactions_df

def test_engine():
    print("1. Initializing Engine...")
    refresh_engine_data()
    
    # User ID from your screenshot
    test_user_id = "b1bdc178-f67a-4229-b9d1-18970c388225"
    
    print(f"\n2. Generating Recs for User: {test_user_id}")
    
    # Check if user exists in matrix
    if interactions_df is not None:
        if test_user_id in interactions_df["user_id"].values:
            print("   ✅ User found in interaction data")
            user_rows = interactions_df[interactions_df["user_id"] == test_user_id]
            print(f"   User has {len(user_rows)} interactions")
        else:
            print("   ❌ User NOT found in interaction data! (Possible ID mismatch or data load failed)")
    else:
        print("   ❌ Interactions DF is None")

    try:
        recs = recommend_for_user_hybrid(test_user_id, top_k=5)
        print(f"\n3. Recommendation Results ({len(recs)} items):")
        for r in recs:
             print(f"   - [{r['final_score']:.4f}] {r['name']} (Reason: {r['reason']})")
             
        if not recs:
            print("\n⚠️ No recommendations returned. Logic might be too strict or sparse data.")
            
    except Exception as e:
        print(f"\n❌ Error during recommendation: {e}")

if __name__ == "__main__":
    test_engine()
