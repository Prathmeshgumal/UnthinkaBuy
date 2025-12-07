"""
Pydantic models for request/response validation
"""
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# User Model for authentication
class User(BaseModel):
    id: str
    email: str
    name: str

# Auth Models
class UserSignup(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str

class AuthResponse(BaseModel):
    user: UserResponse
    token: str
    message: str

# Product Models
class Product(BaseModel):
    id: str
    name: str
    main_category: str
    sub_category: str
    image: str
    link: Optional[str] = None
    ratings: Optional[str] = None
    no_of_ratings: Optional[str] = None
    discount_price: Optional[str] = None
    actual_price: Optional[str] = None
    brand: Optional[str] = None

class ProductsResponse(BaseModel):
    products: List[Product]
    total: int
    page: int
    limit: int
