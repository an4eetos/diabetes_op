import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import User


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, user_id: uuid.UUID) -> User | None:
        return self.db.get(User, user_id)

    def get_by_email(self, email: str) -> User | None:
        return self.db.scalar(select(User).where(User.email == email.lower()))

    def list(self, limit: int = 50, offset: int = 0) -> list[User]:
        return list(self.db.scalars(select(User).order_by(User.created_at.desc()).limit(limit).offset(offset)))

    def add(self, user: User) -> User:
        self.db.add(user)
        self.db.flush()
        return user

