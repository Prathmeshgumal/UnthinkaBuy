"""
Security utilities for password hashing and JWT tokens
"""
import bcrypt
import jwt
from datetime import datetime, timedelta
from typing import Optional
import secrets
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from config import settings
from models import User

security = HTTPBearer()

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return bcrypt.checkpw(
        plain_password.encode('utf-8'), 
        hashed_password.encode('utf-8')
    )

def create_access_token(user_id: str, email: str) -> str:
    """Create a JWT access token"""
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user_id,
        "email": email,
        "exp": expire,
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def verify_token(token: str) -> Optional[dict]:
    """Verify and decode a JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def generate_session_token() -> str:
    """Generate a secure random session token"""
    return secrets.token_urlsafe(32)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> User:
    """
    Dependency to get the current authenticated user from JWT token
    """
    token = credentials.credentials
    
    # Verify the token
    payload = verify_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Extract user info from token
    user_id = payload.get("sub")
    email = payload.get("email")
    
    if user_id is None or email is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create and return User object
    return User(id=user_id, email=email, name=email.split('@')[0])

