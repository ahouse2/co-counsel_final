import asyncio
import sys
import os
from unittest.mock import MagicMock, AsyncMock

# Add root to path
sys.path.append(os.getcwd())

from backend.app.services.narrative_service import NarrativeService
from backend.app.services.devils_advocate_service import DevilsAdvocateService
from backend.app.storage.timeline_store import TimelineEvent
from datetime import datetime

async def verify_system_2():
    print("Verifying System 2 Reasoning (Phase 7)...")
    
    # 1. Mock Dependencies
    mock_timeline = MagicMock()
    mock_doc_store = MagicMock()
    mock_kg = MagicMock()
    mock_llm = MagicMock()
    
    # Mock Timeline Data
    mock_timeline.get_timeline.return_value = [
        TimelineEvent(
            id="1", 
            ts=datetime.now(), 
            title="Meeting", 
            summary="Meeting with client", 
            citations=[], 
            risk_score=0.1, 
            risk_band="low",
            case_id="test_case"
        )
    ]
    
    # Mock Doc Store
    mock_doc_store.list_all_documents.return_value = [
        {"filename": "contract.pdf", "metadata": {"ai_summary": {"summary": "A contract."}}}
    ]
    
    # Mock KG
    mock_kg.get_case_context = AsyncMock(return_value={"entities": [], "relationships": []})
    mock_kg.cause_support_scores = AsyncMock(return_value={})
    mock_kg.run_cypher_query = AsyncMock(return_value=[])
    
    # Mock LLM
    mock_llm.generate_text = AsyncMock(return_value='{"critique_summary": "Weak case", "weaknesses": []}')

    # 2. Verify NarrativeService
    print("\n[NarrativeService]")
    narrative_service = NarrativeService(mock_timeline, mock_doc_store, mock_kg)
    narrative_service.llm_service = mock_llm # Inject mock
    
    # Test Prosecution Narrative
    print("  Testing Prosecution Narrative...")
    mock_llm.generate_text.return_value = "The defendant is guilty."
    narrative = await narrative_service.generate_narrative("test_case", perspective="prosecution")
    print(f"  Result: {narrative}")
    assert "defendant is guilty" in narrative
    
    # Test Defense Narrative
    print("  Testing Defense Narrative...")
    mock_llm.generate_text.return_value = "The defendant is innocent."
    narrative = await narrative_service.generate_narrative("test_case", perspective="defense")
    print(f"  Result: {narrative}")
    assert "defendant is innocent" in narrative

    # 3. Verify DevilsAdvocateService
    print("\n[DevilsAdvocateService]")
    da_service = DevilsAdvocateService(mock_timeline, mock_doc_store, mock_kg)
    da_service.llm_service = mock_llm # Inject mock
    
    # Test Critique
    print("  Testing Narrative Critique...")
    mock_llm.generate_text.return_value = '''
    {
        "critique_summary": "The prosecution relies on circumstantial evidence.",
        "weaknesses": [
            {
                "claim": "Defendant was there",
                "counter_argument": "No proof",
                "strategy": "Highlight lack of DNA",
                "severity": "high"
            }
        ]
    }
    '''
    critique = await da_service.critique_narrative("test_case", "The defendant is guilty", "prosecution")
    print(f"  Result: {critique}")
    assert critique["critique_summary"] == "The prosecution relies on circumstantial evidence."
    assert len(critique["weaknesses"]) == 1
    
    print("\nSUCCESS: System 2 Reasoning logic verified.")

if __name__ == "__main__":
    asyncio.run(verify_system_2())
