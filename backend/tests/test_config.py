from app.core.config import normalize_database_url


def test_normalize_postgres_url() -> None:
    assert (
        normalize_database_url("postgres://user:pass@host:5432/db")
        == "postgresql+psycopg://user:pass@host:5432/db"
    )


def test_normalize_postgresql_url() -> None:
    assert (
        normalize_database_url("postgresql://user:pass@host:5432/db")
        == "postgresql+psycopg://user:pass@host:5432/db"
    )


def test_leaves_psycopg_url_unchanged() -> None:
    url = "postgresql+psycopg://user:pass@host:5432/db"
    assert normalize_database_url(url) == url
