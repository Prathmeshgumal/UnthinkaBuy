"""
Database connection and Supabase client
"""
from supabase import create_client, Client
from typing import Optional
from config import settings

_supabase_client: Optional[Client] = None

def get_supabase_client() -> Optional[Client]:
    """Create and return a Supabase client, or None if credentials are missing"""
    global _supabase_client
    
    if _supabase_client is not None:
        return _supabase_client
    
    # Check if credentials are available
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        print("[Database] Warning: Supabase credentials not configured. Some features may not work.")
        return None
    
    try:
        _supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        return _supabase_client
    except Exception as e:
        print(f"[Database] Error creating Supabase client: {str(e)}")
        return None

# Singleton instance - lazy initialization
def get_supabase() -> Optional[Client]:
    """Get the Supabase client instance"""
    return get_supabase_client()

# For backward compatibility
supabase: Optional[Client] = None

def _init_supabase():
    """Initialize supabase on first access"""
    global supabase
    if supabase is None:
        supabase = get_supabase_client()
    return supabase

# Initialize on import but handle errors gracefully
try:
    supabase = get_supabase_client()
except Exception as e:
    print(f"[Database] Failed to initialize Supabase client: {str(e)}")
    supabase = None
