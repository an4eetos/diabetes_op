import uuid

from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.models import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserUpdate


class UserService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = UserRepository(db)

    def create(self, payload: UserCreate) -> User:
        user = User(
            email=payload.email.lower(),
            full_name=payload.full_name,
            role=payload.role,
            hashed_password=hash_password(payload.password),
            is_active=payload.is_active,
            preferred_language=payload.preferred_language,
        )
        self.repository.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update(self, user_id: uuid.UUID, payload: UserUpdate) -> User | None:
        user = self.repository.get(user_id)
        if not user:
            return None

        data = payload.model_dump(exclude_unset=True)
        password = data.pop("password", None)
        for field, value in data.items():
            setattr(user, field, value)
        if password:
            user.hashed_password = hash_password(password)

        self.db.commit()
        self.db.refresh(user)
        return user
