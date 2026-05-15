from datetime import datetime
import uuid

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.domain.enums import UserRole


class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=200)
    role: UserRole
    is_active: bool = True
    preferred_language: str = Field(default="ru", pattern="^(ru|kk|en)$")


class UserCreate(UserBase):
    password: str = Field(min_length=10, max_length=128)


class UserUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=200)
    role: UserRole | None = None
    is_active: bool | None = None
    preferred_language: str | None = Field(default=None, pattern="^(ru|kk|en)$")
    password: str | None = Field(default=None, min_length=10, max_length=128)


class UserRead(UserBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserPreferencesUpdate(BaseModel):
    preferred_language: str = Field(pattern="^(ru|kk|en)$")
