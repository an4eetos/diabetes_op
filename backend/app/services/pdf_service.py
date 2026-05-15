from datetime import UTC, datetime

from jinja2 import Environment, FileSystemLoader, select_autoescape
from app.core.config import get_settings
from app.db.models import Patient, Screening, User
from app.i18n import TranslationService


class PDFService:
    def __init__(self) -> None:
        settings = get_settings()
        self.environment = Environment(
            loader=FileSystemLoader(settings.pdf_template_dir),
            autoescape=select_autoescape(("html", "xml")),
        )
        self.translation_service = TranslationService()

    def render_protocol(self, *, patient: Patient, screening: Screening, doctor: User, language: str) -> bytes:
        from weasyprint import HTML

        template = self.environment.get_template("protocol.html")
        tr = self.translation_service.get(language)
        html = template.render(
            patient=patient,
            screening=screening,
            doctor=doctor,
            generated_at=datetime.now(UTC),
            tr=tr,
            recommendation=lambda code: self.translation_service.recommendation(code, language),
        )
        return HTML(string=html).write_pdf()
