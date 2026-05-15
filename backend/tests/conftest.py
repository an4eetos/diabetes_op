import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.security import hash_password
from app.db.base import Base
from app.db.models import User
from app.db.session import get_db
from app.domain.enums import UserRole
from app.main import app


SQLALCHEMY_DATABASE_URL = "sqlite+pysqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, expire_on_commit=False)


@pytest.fixture()
def client():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    db.add(
        User(
            email="admin@example.com",
            full_name="Admin User",
            role=UserRole.ADMIN,
            hashed_password=hash_password("ChangeMe123!"),
            is_active=True,
        )
    )
    db.commit()
    db.close()

    def override_get_db():
        test_db = TestingSessionLocal()
        try:
            yield test_db
        finally:
            test_db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)

