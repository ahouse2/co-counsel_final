from sqlalchemy import Column, String, DateTime, Integer, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from ..database import Base

class MockTrialSession(Base):
    __tablename__ = "mock_trial_sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String, ForeignKey("cases.id"), nullable=True) # Optional link to a case
    
    # Game State Fields
    phase = Column(String, default="idle")
    player_health = Column(Integer, default=100)
    opponent_health = Column(Integer, default=100)
    current_evidence = Column(String, nullable=True)
    score = Column(Integer, default=0)
    message = Column(String, default="")
    
    # JSON fields for lists/complex structures
    log = Column(JSON, default=list)
    available_actions = Column(JSON, default=list)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    case = relationship("Case")
