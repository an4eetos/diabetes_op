import uuid

from sqlalchemy.orm import Session

from app.repositories.audit_repository import AuditRepository


SAFE_METADATA_KEYS = {"changed_fields", "risk_category", "algorithm_version", "screening_id"}


class AuditService:
    def __init__(self, db: Session):
        self.repository = AuditRepository(db)

    def log(
        self,
        *,
        actor_user_id: uuid.UUID | None,
        action: str,
        entity_type: str,
        entity_id: str | None,
        metadata: dict | None = None,
    ) -> None:
        safe_metadata = self._sanitize_metadata(metadata or {})
        self.repository.add(
            actor_user_id=actor_user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            metadata=safe_metadata,
        )

    @staticmethod
    def _sanitize_metadata(metadata: dict) -> dict:
        return {key: value for key, value in metadata.items() if key in SAFE_METADATA_KEYS}

