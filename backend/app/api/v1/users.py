import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.models import User
from app.db.session import get_db
from app.domain.enums import UserRole
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserRead, UserUpdate
from app.services.user_service import UserService


router = APIRouter(dependencies=[Depends(require_roles(UserRole.ADMIN))])


@router.get("", response_model=list[UserRead])
def list_users(limit: int = 50, offset: int = 0, db: Session = Depends(get_db)) -> list[User]:
    return UserRepository(db).list(limit=limit, offset=offset)


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, db: Session = Depends(get_db)) -> User:
    try:
        return UserService(db).create(payload)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User email already exists") from exc


@router.patch("/{user_id}", response_model=UserRead)
def update_user(user_id: uuid.UUID, payload: UserUpdate, db: Session = Depends(get_db)) -> User:
    user = UserService(db).update(user_id, payload)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

