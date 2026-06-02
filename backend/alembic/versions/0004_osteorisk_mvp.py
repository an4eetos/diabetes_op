"""Add OsteoRisk-AI prediction workflow schema.

Revision ID: 0004_osteorisk_mvp
Revises: 0003_menopause_status
Create Date: 2026-06-02
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0004_osteorisk_mvp"
down_revision = "0003_menopause_status"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("ALTER TYPE menopause_status ADD VALUE IF NOT EXISTS 'PREMENOPAUSE'")
        op.execute("ALTER TYPE menopause_status ADD VALUE IF NOT EXISTS 'PERIMENOPAUSE'")
        op.execute("ALTER TYPE menopause_status ADD VALUE IF NOT EXISTS 'POSTMENOPAUSE'")

    op.add_column("patients", sa.Column("patient_external_id", sa.String(length=120), nullable=True))
    op.create_index(op.f("ix_patients_patient_external_id"), "patients", ["patient_external_id"], unique=True)
    op.alter_column("patients", "first_name", nullable=True)
    op.alter_column("patients", "last_name", nullable=True)
    op.alter_column("patients", "sex", nullable=True)

    op.add_column("screenings", sa.Column("height_cm", sa.Integer(), nullable=True))
    op.add_column("screenings", sa.Column("weight_kg", sa.Integer(), nullable=True))
    op.add_column("screenings", sa.Column("diabetes_duration", sa.String(length=40), nullable=True))
    op.add_column("screenings", sa.Column("hba1c", sa.Float(), nullable=True))
    op.add_column("screenings", sa.Column("has_polyneuropathy", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("screenings", sa.Column("has_retinopathy", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("screenings", sa.Column("has_nephropathy", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("screenings", sa.Column("menopause_onset_age", sa.Integer(), nullable=True))
    op.add_column("screenings", sa.Column("postmenopause_duration", sa.Integer(), nullable=True))
    op.add_column("screenings", sa.Column("vitamin_d", sa.Float(), nullable=True))
    op.add_column("screenings", sa.Column("pth", sa.Float(), nullable=True))
    op.add_column("screenings", sa.Column("alkaline_phosphatase", sa.Integer(), nullable=True))
    op.add_column("screenings", sa.Column("total_calcium", sa.Float(), nullable=True))
    op.add_column("screenings", sa.Column("falls_last_12_months", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("screenings", sa.Column("tug_seconds", sa.Float(), nullable=True))
    op.add_column("screenings", sa.Column("hand_grip_kg", sa.Float(), nullable=True))
    op.add_column("screenings", sa.Column("t_score", sa.Float(), nullable=True))

    op.alter_column("screenings", "diabetes_duration_years", nullable=True)
    op.alter_column("screenings", "hba1c_percent", nullable=True)
    op.alter_column("screenings", "previous_low_energy_fractures", nullable=True)
    op.alter_column("screenings", "previous_myocardial_infarction", nullable=True)
    op.alter_column("screenings", "previous_stroke", nullable=True)
    op.alter_column("screenings", "total_risk", nullable=True)
    op.alter_column("screenings", "vascular_risk", nullable=True)
    op.alter_column("screenings", "skeletal_risk", nullable=True)
    op.alter_column("screenings", "risk_category", nullable=True)
    op.alter_column("screenings", "recommendation_items", nullable=True)
    op.alter_column("screenings", "algorithm_version", nullable=True)
    op.alter_column("screenings", "algorithm_disclaimer", nullable=True)

    op.create_table(
        "predictions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("screening_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("probability", sa.Float(), nullable=False),
        sa.Column("risk_category", sa.String(length=30), nullable=False),
        sa.Column("recommendation_code", sa.String(length=80), nullable=False),
        sa.Column("shap_factors_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("model_version", sa.String(length=80), nullable=False),
        sa.Column("model_type", sa.String(length=80), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["screening_id"], ["screenings.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_predictions_created_at"), "predictions", ["created_at"], unique=False)
    op.create_index(op.f("ix_predictions_risk_category"), "predictions", ["risk_category"], unique=False)
    op.create_index(op.f("ix_predictions_screening_id"), "predictions", ["screening_id"], unique=False)

    for table, columns in {
        "screenings": ["has_polyneuropathy", "has_retinopathy", "has_nephropathy", "falls_last_12_months"],
    }.items():
        for column in columns:
            op.alter_column(table, column, server_default=None)


def downgrade() -> None:
    op.drop_index(op.f("ix_predictions_screening_id"), table_name="predictions")
    op.drop_index(op.f("ix_predictions_risk_category"), table_name="predictions")
    op.drop_index(op.f("ix_predictions_created_at"), table_name="predictions")
    op.drop_table("predictions")

    for column in [
        "t_score",
        "hand_grip_kg",
        "tug_seconds",
        "falls_last_12_months",
        "egfr",
        "total_calcium",
        "alkaline_phosphatase",
        "pth",
        "vitamin_d",
        "postmenopause_duration",
        "menopause_onset_age",
        "has_nephropathy",
        "has_retinopathy",
        "has_polyneuropathy",
        "hba1c",
        "diabetes_duration",
        "weight_kg",
        "height_cm",
    ]:
        # egfr already existed in the previous schema.
        if column == "egfr":
            continue
        op.drop_column("screenings", column)

    op.drop_index(op.f("ix_patients_patient_external_id"), table_name="patients")
    op.drop_column("patients", "patient_external_id")
