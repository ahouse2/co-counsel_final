from sqlalchemy import Column, String, DateTime, Text, Integer
from sqlalchemy.sql import func
from backend.app.database import Base

class Case(Base):
    __tablename__ = "cases"

    id = Column(String, primary_key=True, index=True)
    case_number = Column(String, unique=True, index=True, nullable=True)  # Human-readable: CC-2024-001
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    status = Column(String, default="active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

