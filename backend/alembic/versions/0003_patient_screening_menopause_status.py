"""Add menopause status to patient and screening records.

Revision ID: 0003_menopause_status
Revises: 0002_user_language
Create Date: 2026-05-18
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0003_menopause_status"
down_revision = "0002_user_language"
branch_labels = None
depends_on = None


menopause_status = postgresql.ENUM("YES", "NO", "UNKNOWN", name="menopause_status")


def upgrade() -> None:
    bind = op.get_bind()
    menopause_status.create(bind, checkfirst=True)
    op.add_column(
        "patients",
        sa.Column("menopause_status", postgresql.ENUM(name="menopause_status", create_type=False), nullable=True),
    )
    op.add_column(
        "screenings",
        sa.Column("menopause_status", postgresql.ENUM(name="menopause_status", create_type=False), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("screenings", "menopause_status")
    op.drop_column("patients", "menopause_status")

    bind = op.get_bind()
    menopause_status.drop(bind, checkfirst=True)
