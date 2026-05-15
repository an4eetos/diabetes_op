import io
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.models import Screening, User
from app.db.session import get_db
from app.domain.enums import AuditAction
from app.repositories.screening_repository import ScreeningRepository
from app.services.audit_service import AuditService
from app.services.pdf_service import PDFService


router = APIRouter()


@router.get("/screenings/{screening_id}")
async def export_screening_pdf(
    screening_id: uuid.UUID,
    lang: str | None = Query(default=None, pattern="^(ru|kk|en)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StreamingResponse:
    screening: Screening | None = ScreeningRepository(db).get(screening_id)
    if not screening:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Screening not found")

    try:
        pdf_bytes = await run_in_threadpool(
            PDFService().render_protocol,
            patient=screening.patient,
            screening=screening,
            doctor=screening.performed_by,
            language=lang or current_user.preferred_language,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="pdf_generation_failed",
        ) from exc
    AuditService(db).log(
        actor_user_id=current_user.id,
        action=AuditAction.PDF_EXPORTED.value,
        entity_type="screening",
        entity_id=str(screening.id),
        metadata={"screening_id": str(screening.id)},
    )
    db.commit()

    filename = f"screening-protocol-{screening.id}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
