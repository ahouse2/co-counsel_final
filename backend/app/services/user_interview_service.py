"""
User Interview Service - Generates dynamic questions to gather user context.
System-driven Q&A to supplement evidence with user knowledge.
"""

import logging
import json
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from pathlib import Path
from enum import Enum

from backend.app.config import get_settings
from backend.app.services.llm_service import get_llm_service
from backend.app.services.knowledge_graph_service import get_knowledge_graph_service
from backend.app.services.fact_pattern_service import get_fact_pattern_service

logger = logging.getLogger(__name__)


class QuestionStatus(str, Enum):
    PENDING = "pending"
    ANSWERED = "answered"
    SKIPPED = "skipped"
    UNKNOWN = "unknown"  # User marked "I don't know"


class InterviewQuestion(BaseModel):
    """A dynamic question generated from case data."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question: str
    context: str  # Why this question is being asked
    category: str  # relationship, timeline, document, entity, contradiction, clarification
    priority: int = Field(ge=1, le=5, default=3)  # 1=highest priority
    related_entities: List[str] = Field(default_factory=list)
    related_docs: List[str] = Field(default_factory=list)
    status: QuestionStatus = QuestionStatus.PENDING
    response: Optional[str] = None
    responded_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class InterviewStatus(BaseModel):
    """Status of the user interview for a case."""
    case_id: str
    total_questions: int
    answered: int
    skipped: int
    unknown: int
    pending: int
    is_complete: bool
    last_updated: datetime = Field(default_factory=datetime.utcnow)


class UserInterviewService:
    """
    Generates and manages dynamic interview questions.
    Questions are system-driven based on KG data, fact patterns, and gaps.
    """
    
    def __init__(self):
        settings = get_settings()
        self.storage_path = Path(settings.case_storage_path) / "interviews"
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self.llm_service = get_llm_service()
        self.kg_service = get_knowledge_graph_service()
        self.fact_service = get_fact_pattern_service()
    
    def _get_interview_path(self, case_id: str) -> Path:
        return self.storage_path / f"interview_{case_id}.json"
    
    def _read_questions(self, case_id: str) -> List[InterviewQuestion]:
        path = self._get_interview_path(case_id)
        if not path.exists():
            return []
        with open(path, 'r') as f:
            data = json.load(f)
        return [InterviewQuestion(**q) for q in data]
    
    def _write_questions(self, case_id: str, questions: List[InterviewQuestion]):
        path = self._get_interview_path(case_id)
        with open(path, 'w') as f:
            json.dump([q.model_dump() for q in questions], f, indent=2, default=str)
    
    async def generate_questions(self, case_id: str, max_questions: int = 10) -> List[InterviewQuestion]:
        """
        Generates dynamic interview questions based on case data.
        Questions help fill gaps and clarify ambiguities.
        """
        logger.info(f"Generating interview questions for case {case_id}")
        
        # Gather context
        kg_context = await self._get_kg_summary(case_id)
        fact_patterns = self.fact_service.get_patterns(case_id)
        
        # Build prompt for dynamic question generation
        prompt = f"""You are a legal investigator conducting an initial interview about a case.
Based on the evidence and fact patterns below, generate {max_questions} targeted questions to ask the client.

EVIDENCE SUMMARY:
{json.dumps(kg_context, indent=2, default=str)}

IDENTIFIED FACT PATTERNS:
{json.dumps([p.model_dump() for p in fact_patterns], indent=2, default=str)}

Generate questions that:
1. CLARIFY relationships between parties (Who are these people to each other?)
2. FILL GAPS in the timeline (What happened between X date and Y date?)
3. RESOLVE CONTRADICTIONS (Document A says X, Document B says Y - which is accurate?)
4. EXPLAIN CONTEXT not evident in documents (What was the intent behind this action?)
5. IDENTIFY MISSING EVIDENCE (Are there other documents or witnesses?)

For each question, provide:
- question: The actual question to ask
- context: Why you're asking this (1 sentence)
- category: relationship, timeline, document, entity, contradiction, clarification, missing_evidence
- priority: 1 (critical) to 5 (nice to know)
- related_entities: Names of people/orgs this question concerns

Return as JSON array:
[
  {{
    "question": "Can you describe your relationship with John Smith during 2022?",
    "context": "Multiple emails suggest a business relationship but the exact nature is unclear.",
    "category": "relationship",
    "priority": 1,
    "related_entities": ["John Smith"]
  }},
  ...
]

IMPORTANT: Questions should be open-ended and non-leading. Focus on facts, not opinions.
Ensure output is valid JSON.
"""
        
        try:
            response = await self.llm_service.generate_text(prompt)
            
            # Parse JSON
            if "```json" in response:
                response = response.split("```json")[1].split("```")[0]
            elif "```" in response:
                response = response.split("```")[1].split("```")[0]
            
            raw_questions = json.loads(response.strip())
            
            # Convert to InterviewQuestion objects
            questions = []
            for rq in raw_questions[:max_questions]:
                q = InterviewQuestion(
                    question=rq.get("question", ""),
                    context=rq.get("context", ""),
                    category=rq.get("category", "clarification"),
                    priority=int(rq.get("priority", 3)),
                    related_entities=rq.get("related_entities", []),
                    related_docs=rq.get("related_docs", [])
                )
                questions.append(q)
            
            # Sort by priority
            questions.sort(key=lambda q: q.priority)
            
            # Write to storage
            self._write_questions(case_id, questions)
            
            logger.info(f"Generated {len(questions)} interview questions for case {case_id}")
            return questions
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM response: {e}")
            return []
        except Exception as e:
            logger.error(f"Question generation failed: {e}")
            return []
    
    async def _get_kg_summary(self, case_id: str) -> Dict[str, Any]:
        """Gets a summary of KG data for question generation."""
        try:
            # Get entity counts and types
            summary_query = """
            MATCH (n)
            WHERE n.case_id = $case_id
            RETURN labels(n) as type, count(n) as count
            """
            type_counts = await self.kg_service.run_cypher_query(summary_query, {"case_id": case_id})
            
            # Get key entities
            entity_query = """
            MATCH (n:Person|Organization)
            WHERE n.case_id = $case_id OR exists((n)-[:MENTIONED_IN]->(:Document {case_id: $case_id}))
            RETURN labels(n) as type, n.name as name, n.id as id
            LIMIT 20
            """
            entities = await self.kg_service.run_cypher_query(entity_query, {"case_id": case_id})
            
            # Get document titles
            doc_query = """
            MATCH (d:Document {case_id: $case_id})
            RETURN d.filename as filename, d.doc_type as doc_type
            LIMIT 20
            """
            docs = await self.kg_service.run_cypher_query(doc_query, {"case_id": case_id})
            
            return {
                "type_counts": type_counts or [],
                "key_entities": entities or [],
                "documents": docs or []
            }
        except Exception as e:
            logger.error(f"Failed to get KG summary: {e}")
            return {}
    
    def get_questions(self, case_id: str) -> List[InterviewQuestion]:
        """Returns all questions for a case."""
        return self._read_questions(case_id)
    
    def get_pending_questions(self, case_id: str) -> List[InterviewQuestion]:
        """Returns only pending (unanswered) questions."""
        questions = self._read_questions(case_id)
        return [q for q in questions if q.status == QuestionStatus.PENDING]
    
    def submit_response(
        self, 
        case_id: str, 
        question_id: str, 
        response: Optional[str] = None,
        status: QuestionStatus = QuestionStatus.ANSWERED
    ) -> Optional[InterviewQuestion]:
        """
        Submit a response to a question.
        status can be ANSWERED, SKIPPED, or UNKNOWN.
        """
        questions = self._read_questions(case_id)
        
        for i, q in enumerate(questions):
            if q.id == question_id:
                q.status = status
                q.response = response
                q.responded_at = datetime.utcnow()
                questions[i] = q
                self._write_questions(case_id, questions)
                
                # If answered, store in KG as UserContext
                if status == QuestionStatus.ANSWERED and response:
                    self._store_response_in_kg(case_id, q, response)
                
                return q
        
        return None
    
    def _store_response_in_kg(self, case_id: str, question: InterviewQuestion, response: str):
        """Stores user response as a UserContext node in the KG."""
        try:
            # This would normally use kg_service.add_entity
            # For now, we'll just log - actual KG integration would happen here
            logger.info(f"Storing user response for case {case_id}: {question.category} - {response[:50]}...")
        except Exception as e:
            logger.error(f"Failed to store response in KG: {e}")
    
    def get_interview_status(self, case_id: str) -> InterviewStatus:
        """Gets the current status of the interview."""
        questions = self._read_questions(case_id)
        
        answered = sum(1 for q in questions if q.status == QuestionStatus.ANSWERED)
        skipped = sum(1 for q in questions if q.status == QuestionStatus.SKIPPED)
        unknown = sum(1 for q in questions if q.status == QuestionStatus.UNKNOWN)
        pending = sum(1 for q in questions if q.status == QuestionStatus.PENDING)
        
        return InterviewStatus(
            case_id=case_id,
            total_questions=len(questions),
            answered=answered,
            skipped=skipped,
            unknown=unknown,
            pending=pending,
            is_complete=(pending == 0) if questions else False
        )
    
    def reset_interview(self, case_id: str) -> bool:
        """Clears all questions for a case (for re-generation)."""
        path = self._get_interview_path(case_id)
        if path.exists():
            path.unlink()
            return True
        return False


def get_user_interview_service() -> UserInterviewService:
    """Dependency injection helper."""
    return UserInterviewService()
