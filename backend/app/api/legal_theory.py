from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any

from ..models.api import (
    QueryResponse,
)
from ..services.retrieval import RetrievalMode, RetrievalService, get_retrieval_service
from ..security.authz import Principal
from ..security.dependencies import (
    authorize_query,
)
from toolsnteams_previous.legal_theory_engine import LegalTheoryEngine

router = APIRouter()

class LegalTheorySuggestion(BaseModel):
    cause: str
    score: float
    elements: List[Dict[str, Any]]
    defenses: List[str]
    indicators: List[str]
    missing_elements: List[str]

class LegalTheorySubgraph(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]

@router.get("/legal_theory", response_model=QueryResponse)
def get_legal_theory(
    query: str,
    _principal: Principal = Depends(authorize_query),
    service: RetrievalService = Depends(get_retrieval_service),
    mode: RetrievalMode = Query(RetrievalMode.SEMANTIC, description="Retrieval mode"),
) -> QueryResponse:
    return service.query(query, mode)

@router.get("/legal_theory/suggestions", response_model=List[LegalTheorySuggestion])
async def get_legal_theory_suggestions(
    _principal: Principal = Depends(authorize_query),
):
    """
    Returns ranked candidate legal theories based on factual support.
    """
    engine = LegalTheoryEngine()
    try:
        suggestions = engine.suggest_theories()
        return suggestions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred while suggesting theories: {e}")
    finally:
        engine.close()

@router.get("/legal_theory/{cause}/subgraph", response_model=LegalTheorySubgraph)
async def get_legal_theory_subgraph(
    cause: str,
    _principal: Principal = Depends(authorize_query),
):
    """
    Exposes subgraph retrieval for a specific cause of action.
    """
    engine = LegalTheoryEngine()
    try:
        nodes, edges = engine.get_theory_subgraph(cause)
        return LegalTheorySubgraph(nodes=nodes, edges=edges)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred while retrieving subgraph: {e}")
    finally:
        engine.close()
