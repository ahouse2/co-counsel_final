"""
Verification script for BackgroundResearchAgent.
Tests the agent's ability to detect gaps and missing evidence using mocked services.
"""

import asyncio
import sys
import os
from unittest.mock import MagicMock, AsyncMock
from datetime import datetime, timedelta

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Mock dependencies BEFORE importing the agent
sys.modules["backend.app.services.timeline_service"] = MagicMock()
sys.modules["backend.app.services.knowledge_graph_service"] = MagicMock()
sys.modules["backend.app.services.llm_service"] = MagicMock()

from backend.app.agents.background_research_agent import BackgroundResearchAgent

async def test_background_agent():
    print("🧪 Testing BackgroundResearchAgent...")
    
    # Setup mocks
    agent = BackgroundResearchAgent()
    
    # 1. Mock Timeline Service (Create a gap)
    agent.timeline_service.get_timeline.return_value = [
        {"id": "e1", "title": "Event 1", "event_date": "2023-01-01T10:00:00Z"},
        {"id": "e2", "title": "Event 2", "event_date": "2023-01-15T10:00:00Z"}  # 14 day gap
    ]
    
    # 2. Mock KG Service
    agent.kg_service.get_case_context = AsyncMock(return_value={
        "entities": ["Email from Bob", "Reply from Alice"],
        "relationships": ["Bob sent Email", "Alice replied"]
    })
    
    # 3. Mock LLM Service
    agent.llm_service.generate_json = AsyncMock(return_value=[
        {
            "description": "Missing Attachment",
            "action_item": "Search for attachment.pdf"
        }
    ])
    
    # Run Analysis
    insights = await agent.analyze_case("test_case_id")
    
    # Verify Results
    print(f"✅ Analysis complete. Found {len(insights)} insights.")
    
    gap_insights = [i for i in insights if i['type'] == 'gap']
    evidence_insights = [i for i in insights if i['type'] == 'missing_evidence']
    
    if len(gap_insights) > 0:
        print(f"✅ Detected Timeline Gap: {gap_insights[0]['description']}")
    else:
        print("❌ Failed to detect timeline gap")
        
    if len(evidence_insights) > 0:
        print(f"✅ Detected Missing Evidence: {evidence_insights[0]['description']}")
    else:
        print("❌ Failed to detect missing evidence")

if __name__ == "__main__":
    asyncio.run(test_background_agent())
