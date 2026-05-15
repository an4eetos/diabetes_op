from datetime import timedelta

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import create_token, verify_password
from app.db.models import User
from app.repositories.user_repository import UserRepository


class AuthService:
    def __init__(self, db: Session):
        self.repository = UserRepository(db)

    def authenticate(self, email: str, password: str) -> User | None:
        user = self.repository.get_by_email(email)
        if not user or not user.is_active:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    def issue_tokens(self, user: User) -> tuple[str, str]:
        settings = get_settings()
        access = create_token(
            subject=str(user.id),
            token_type="access",
            expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
            claims={"role": user.role.value},
        )
        refresh = create_token(
            subject=str(user.id),
            token_type="refresh",
            expires_delta=timedelta(days=settings.refresh_token_expire_days),
            claims={"role": user.role.value},
        )
        return access, refresh

