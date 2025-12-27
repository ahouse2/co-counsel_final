"""
Interview API - Endpoints for user interview and fact patterns.
"""

from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
import logging

from backend.app.services.user_interview_service import (
    get_user_interview_service,
    InterviewQuestion,
    InterviewStatus,
    QuestionStatus
)
from backend.app.services.fact_pattern_service import (
    get_fact_pattern_service,
    FactPattern
)

logger = logging.getLogger(__name__)

router = APIRouter()


# ═══════════════════════════════════════════════════════════════════════════
# REQUEST/RESPONSE MODELS
# ═══════════════════════════════════════════════════════════════════════════

class SubmitResponseRequest(BaseModel):
    response: Optional[str] = None
    status: str = "answered"  # answered, skipped, unknown


class GenerateQuestionsRequest(BaseModel):
    max_questions: int = 10


# ═══════════════════════════════════════════════════════════════════════════
# FACT PATTERN ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/{case_id}/fact-patterns", response_model=List[dict])
async def get_fact_patterns(case_id: str):
    """Get all extracted fact patterns for a case."""
    service = get_fact_pattern_service()
    patterns = service.get_patterns(case_id)
    return [p.model_dump() for p in patterns]


@router.post("/{case_id}/fact-patterns/extract", response_model=List[dict])
async def extract_fact_patterns(case_id: str):
    """Extract fact patterns from case evidence."""
    service = get_fact_pattern_service()
    patterns = await service.extract_patterns(case_id)
    return [p.model_dump() for p in patterns]


# ═══════════════════════════════════════════════════════════════════════════
# INTERVIEW ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/{case_id}/interview/status", response_model=dict)
async def get_interview_status(case_id: str):
    """Get the current status of the user interview."""
    service = get_user_interview_service()
    status = service.get_interview_status(case_id)
    return status.model_dump()


@router.get("/{case_id}/interview/questions", response_model=List[dict])
async def get_interview_questions(case_id: str, pending_only: bool = False):
    """Get interview questions for a case."""
    service = get_user_interview_service()
    if pending_only:
        questions = service.get_pending_questions(case_id)
    else:
        questions = service.get_questions(case_id)
    return [q.model_dump() for q in questions]


@router.post("/{case_id}/interview/generate", response_model=List[dict])
async def generate_interview_questions(case_id: str, request: GenerateQuestionsRequest = None):
    """Generate dynamic interview questions based on case evidence."""
    max_q = request.max_questions if request else 10
    service = get_user_interview_service()
    questions = await service.generate_questions(case_id, max_questions=max_q)
    return [q.model_dump() for q in questions]


@router.post("/{case_id}/interview/questions/{question_id}/respond", response_model=dict)
async def submit_interview_response(case_id: str, question_id: str, request: SubmitResponseRequest):
    """Submit a response to an interview question."""
    service = get_user_interview_service()
    
    # Map status string to enum
    status_map = {
        "answered": QuestionStatus.ANSWERED,
        "skipped": QuestionStatus.SKIPPED,
        "unknown": QuestionStatus.UNKNOWN
    }
    status = status_map.get(request.status, QuestionStatus.ANSWERED)
    
    question = service.submit_response(
        case_id=case_id,
        question_id=question_id,
        response=request.response,
        status=status
    )
    
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    return question.model_dump()


@router.delete("/{case_id}/interview/reset")
async def reset_interview(case_id: str):
    """Reset the interview for a case (clears all questions)."""
    service = get_user_interview_service()
    success = service.reset_interview(case_id)
    return {"success": success, "message": "Interview reset" if success else "No interview found"}
