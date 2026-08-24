import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.core.database import Base, get_db
from backend.app.core.security import create_access_token
from backend.app.main import app
from backend.app.utils.seed_data import seed_database_and_logs
from backend.app.core.config import settings

# Disable background syslog listener during pytest
settings.SYSLOG_ENABLED = False

# Use a test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_logintel.db"
test_engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    seed_database_and_logs(db_engine=test_engine, session_maker=TestingSessionLocal)
    yield
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists("test_logintel.db"):
        try:
            os.remove("test_logintel.db")
        except Exception:
            pass


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture
def admin_headers():
    token = create_access_token(subject="admin", role="admin")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def analyst_headers():
    token = create_access_token(subject="analyst", role="security_analyst")
    return {"Authorization": f"Bearer {token}"}
