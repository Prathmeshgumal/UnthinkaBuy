"""
Authentication routes for signup, login, logout
"""
from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional
from datetime import datetime, timedelta

from models import UserSignup, UserLogin, AuthResponse, UserResponse
from database import get_supabase
from utils.security import hash_password, verify_password, create_access_token, generate_session_token

router = APIRouter()

@router.post("/signup", response_model=AuthResponse)
async def signup(user_data: UserSignup):
    """Register a new user"""
    try:
        supabase = get_supabase()
        if not supabase:
            raise HTTPException(status_code=503, detail="Database not available")
        
        # Check if user already exists
        try:
            existing = supabase.table("users").select("id").eq("email", user_data.email).execute()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        
        if existing.data and len(existing.data) > 0:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Hash password
        password_hash = hash_password(user_data.password)
        
        # Create user in database
        try:
            result = supabase.table("users").insert({
                "email": user_data.email,
                "password_hash": password_hash,
                "name": user_data.name
            }).execute()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create user")
        
        user = result.data[0]
        
        # Create session token
        token = create_access_token(user["id"], user["email"])
        session_token = generate_session_token()
        
        # Store session in database
        expires_at = datetime.utcnow() + timedelta(days=7)
        try:
            supabase.table("sessions").insert({
                "user_id": user["id"],
                "token": session_token,
                "expires_at": expires_at.isoformat()
            }).execute()
        except Exception as e:
            print(f"[Auth] Warning: Failed to create session: {str(e)}")
        
        return AuthResponse(
            user=UserResponse(
                id=user["id"],
                email=user["email"],
                name=user["name"]
            ),
            token=token,
            message="User created successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/login", response_model=AuthResponse)
async def login(credentials: UserLogin):
    """Login with email and password"""
    try:
        supabase = get_supabase()
        if not supabase:
            raise HTTPException(status_code=503, detail="Database not available")
        
        # Find user by email
        try:
            result = supabase.table("users").select("*").eq("email", credentials.email).execute()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        user = result.data[0]
        
        # Verify password
        if not verify_password(credentials.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Create new session token
        token = create_access_token(user["id"], user["email"])
        session_token = generate_session_token()
        
        # Store session
        expires_at = datetime.utcnow() + timedelta(days=7)
        try:
            supabase.table("sessions").insert({
                "user_id": user["id"],
                "token": session_token,
                "expires_at": expires_at.isoformat()
            }).execute()
        except Exception as e:
            print(f"[Auth] Warning: Failed to create session: {str(e)}")
        
        return AuthResponse(
            user=UserResponse(
                id=user["id"],
                email=user["email"],
                name=user["name"]
            ),
            token=token,
            message="Login successful"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/logout")
async def logout(authorization: Optional[str] = Header(None)):
    """Logout and invalidate session"""
    supabase = get_supabase()
    if supabase and authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        try:
            # Delete session from database
            supabase.table("sessions").delete().eq("token", token).execute()
        except Exception as e:
            print(f"[Auth] Warning: Failed to delete session: {str(e)}")
    
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=UserResponse)
async def get_current_user(authorization: Optional[str] = Header(None)):
    """Get current authenticated user"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    from utils.security import verify_token
    
    token = authorization.split(" ")[1]
    payload = verify_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not available")
    
    # Get user from database
    try:
        result = supabase.table("users").select("id, email, name").eq("id", payload["sub"]).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = result.data[0]
    return UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"]
    )
