"""
Configuration settings for the FastAPI backend
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from backend directory
load_dotenv()

# Also try to load .env.local from parent directory (Next.js env)
parent_env_local = Path(__file__).parent.parent / ".env.local"
if parent_env_local.exists():
    load_dotenv(parent_env_local)
    print(f"[Config] Loaded .env.local from {parent_env_local}")
else:
    print(f"[Config] .env.local not found at {parent_env_local}")

class Settings:
    # Supabase Configuration - check multiple possible env var names
    SUPABASE_URL: str = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_ANON_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
    
    # JWT Configuration
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: str = os.getenv("POSTGRES_URL", "")

settings = Settings()
