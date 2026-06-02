from app.core.security import hash_password
from app.db.models import User
from app.db.session import SessionLocal
from app.domain.enums import UserRole
from app.repositories.user_repository import UserRepository


def main() -> None:
    db = SessionLocal()
    try:
        repository = UserRepository(db)
        email = "admin@example.com"
        if repository.get_by_email(email):
            print("Admin user already exists")
            return
        repository.add(
            User(
                email=email,
                full_name="System Administrator",
                role=UserRole.ADMIN,
                hashed_password=hash_password("ChangeMe123!"),
                is_active=True,
            )
        )
        db.commit()
        print("Created admin@example.com / ChangeMe123!")
    finally:
        db.close()


if __name__ == "__main__":
    main()

