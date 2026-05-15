"""Initial medical screening schema.

Revision ID: 0001_initial
Revises:
Create Date: 2026-05-08
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


user_role = postgresql.ENUM("ADMIN", "DOCTOR", "NURSE_REGISTRAR", name="user_role")
sex = postgresql.ENUM("FEMALE", "MALE", "OTHER", name="sex")
risk_category = postgresql.ENUM("LOW", "MEDIUM", "HIGH", name="risk_category")


def upgrade() -> None:
    bind = op.get_bind()
    user_role.create(bind, checkfirst=True)
    sex.create(bind, checkfirst=True)
    risk_category.create(bind, checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("full_name", sa.String(length=200), nullable=False),
        sa.Column("role", postgresql.ENUM(name="user_role", create_type=False), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    op.create_table(
        "patients",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("medical_record_number", sa.String(length=80), nullable=True),
        sa.Column("first_name", sa.String(length=120), nullable=False),
        sa.Column("last_name", sa.String(length=120), nullable=False),
        sa.Column("middle_name", sa.String(length=120), nullable=True),
        sa.Column("date_of_birth", sa.Date(), nullable=True),
        sa.Column("sex", postgresql.ENUM(name="sex", create_type=False), nullable=False),
        sa.Column("phone", sa.String(length=60), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_by_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("medical_record_number"),
    )
    op.create_index("ix_patients_last_first_name", "patients", ["last_name", "first_name"], unique=False)

    op.create_table(
        "screenings",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("patient_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("performed_by_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("age", sa.Integer(), nullable=False),
        sa.Column("sex", postgresql.ENUM(name="sex", create_type=False), nullable=False),
        sa.Column("diabetes_duration_years", sa.Float(), nullable=False),
        sa.Column("hba1c_percent", sa.Float(), nullable=False),
        sa.Column("previous_low_energy_fractures", sa.Boolean(), nullable=False),
        sa.Column("previous_myocardial_infarction", sa.Boolean(), nullable=False),
        sa.Column("previous_stroke", sa.Boolean(), nullable=False),
        sa.Column("bmi", sa.Float(), nullable=True),
        sa.Column("egfr", sa.Float(), nullable=True),
        sa.Column("creatinine_umol_l", sa.Float(), nullable=True),
        sa.Column("bone_metabolism_markers", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("total_risk", sa.Integer(), nullable=False),
        sa.Column("vascular_risk", sa.Integer(), nullable=False),
        sa.Column("skeletal_risk", sa.Integer(), nullable=False),
        sa.Column("risk_category", postgresql.ENUM(name="risk_category", create_type=False), nullable=False),
        sa.Column("recommendation_items", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("algorithm_version", sa.String(length=80), nullable=False),
        sa.Column("algorithm_disclaimer", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"]),
        sa.ForeignKeyConstraint(["performed_by_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_screenings_patient_id"), "screenings", ["patient_id"], unique=False)

    op.create_table(
        "audit_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("actor_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("action", sa.String(length=80), nullable=False),
        sa.Column("entity_type", sa.String(length=80), nullable=False),
        sa.Column("entity_id", sa.String(length=80), nullable=True),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["actor_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_audit_logs_action"), "audit_logs", ["action"], unique=False)
    op.create_index(op.f("ix_audit_logs_created_at"), "audit_logs", ["created_at"], unique=False)
    op.create_index(op.f("ix_audit_logs_entity_type"), "audit_logs", ["entity_type"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_audit_logs_entity_type"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_created_at"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_action"), table_name="audit_logs")
    op.drop_table("audit_logs")
    op.drop_index(op.f("ix_screenings_patient_id"), table_name="screenings")
    op.drop_table("screenings")
    op.drop_index("ix_patients_last_first_name", table_name="patients")
    op.drop_table("patients")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")

    bind = op.get_bind()
    risk_category.drop(bind, checkfirst=True)
    sex.drop(bind, checkfirst=True)
    user_role.drop(bind, checkfirst=True)

