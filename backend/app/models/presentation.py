from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, Integer
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from ..database import Base

class Presentation(Base):
    __tablename__ = "presentations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    case_id = Column(String, ForeignKey("cases.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Store items as JSON for simplicity, or could be a separate table if complex querying needed
    # Given the API structure, items are a list of objects with document_id, order, notes
    items = Column(JSON, default=list)

    # Relationships
    case = relationship("Case", back_populates="presentations")

# Add back_populates to Case model if not already present (will need to check case.py)
