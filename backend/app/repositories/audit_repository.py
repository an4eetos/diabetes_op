import uuid

from sqlalchemy.orm import Session

from app.db.models import AuditLog


class AuditRepository:
    def __init__(self, db: Session):
        self.db = db

    def add(
        self,
        *,
        actor_user_id: uuid.UUID | None,
        action: str,
        entity_type: str,
        entity_id: str | None = None,
        metadata: dict | None = None,
    ) -> AuditLog:
        audit_log = AuditLog(
            actor_user_id=actor_user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            meta=metadata or {},
        )
        self.db.add(audit_log)
        self.db.flush()
        return audit_log

