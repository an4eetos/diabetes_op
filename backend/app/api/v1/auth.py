import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import decode_token
from app.db.models import User
from app.db.session import get_db
from app.domain.enums import AuditAction
from app.repositories.user_repository import UserRepository
from app.schemas.token import LoginRequest, RefreshRequest, TokenResponse
from app.schemas.user import UserPreferencesUpdate, UserRead
from app.services.audit_service import AuditService
from app.services.auth_service import AuthService


router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    auth_service = AuthService(db)
    user = auth_service.authenticate(payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    access_token, refresh_token = auth_service.issue_tokens(user)
    AuditService(db).log(
        actor_user_id=user.id,
        action=AuditAction.USER_LOGIN.value,
        entity_type="user",
        entity_id=str(user.id),
    )
    db.commit()
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)) -> TokenResponse:
    credentials_error = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    try:
        token_payload = decode_token(payload.refresh_token)
        if token_payload.get("type") != "refresh":
            raise ValueError("Invalid token type")
        user_id = uuid.UUID(str(token_payload.get("sub")))
    except (ValueError, TypeError):
        raise credentials_error from None

    user = UserRepository(db).get(user_id)
    if not user or not user.is_active:
        raise credentials_error

    access_token, refresh_token = AuthService(db).issue_tokens(user)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.get("/me", response_model=UserRead)
def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.patch("/me/preferences", response_model=UserRead)
def update_preferences(
    payload: UserPreferencesUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    current_user.preferred_language = payload.preferred_language
    db.commit()
    db.refresh(current_user)
    return current_user
