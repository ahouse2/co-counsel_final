from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, EmailStr
from typing import Optional
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

class FeedbackRequest(BaseModel):
    subject: str
    message: str
    contact: Optional[EmailStr] = None

@router.post("/feedback")
async def submit_feedback(request: FeedbackRequest):
    """
    Submits user feedback, feature requests, or bug reports.
    For now, this logs the feedback. In a production system, it would store it
    in a database or send it to an issue tracking system/email.
    """
    try:
        logger.info(f"Received feedback: Subject='{request.subject}', Contact='{request.contact}', Message='{request.message}'")
        # In a real application, you would save this to a database,
        # send an email, or integrate with an issue tracking system.
        return {"message": "Feedback submitted successfully!"}
    except Exception as e:
        logger.error(f"Failed to submit feedback: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to submit feedback: {e}")
