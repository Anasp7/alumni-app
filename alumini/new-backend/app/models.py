from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from .config import get_config


def get_engine() -> Engine:
    uri = get_config()["SQLALCHEMY_DATABASE_URI"]
    return create_engine(uri, pool_pre_ping=True)


def ping_db() -> bool:
    engine = get_engine()
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    return True


