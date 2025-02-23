from pydantic import BaseModel
from typing import Optional

class UserCreate(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str


class LinkCreate(BaseModel):
    name: str
    url: str
    category: str

class LinkShareRequest(BaseModel):
    username: str
    permission: str

class LinkUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    category: Optional[str] = None

class LinkResponse(BaseModel):
    id: int
    created_by: int
    name: str
    url: str
    category: str

    class Config:
        from_attributes = True