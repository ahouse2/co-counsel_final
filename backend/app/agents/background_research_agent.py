"""
Background Research Agent (The Autonomous Associate)

This agent proactively monitors cases and runs background analysis to find:
1. Timeline Gaps (e.g., "What happened between June 12 and June 14?")
2. Missing Evidence (e.g., "We have the email reply but not the original email")
3. Logical Contradictions (e.g., "Witness A says X, but Document B says Y")

It is triggered automatically by the AutonomousOrchestrator after batch ingestion.
"""

import logging
import asyncio
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict
from datetime import datetime, timezone

from backend.app.services.timeline_service import TimelineService
from backend.app.services.knowledge_graph_service import get_knowledge_graph_service
from backend.app.services.llm_service import get_llm_service
from backend.app.memory_store import CaseMemoryStore

logger = logging.getLogger(__name__)

@dataclass
class Insight:
    type: str  # "gap", "contradiction", "missing_evidence", "pattern"
    confidence: float
    description: str
    action_item: str
    source_ids: List[str]
    created_at: str = datetime.now(timezone.utc).isoformat()

class BackgroundResearchAgent:
    def __init__(self):
        self.timeline_service = TimelineService()
        self.kg_service = get_knowledge_graph_service()
        self.llm_service = get_llm_service()
        self.memory_store = CaseMemoryStore()

    async def analyze_case(self, case_id: str) -> List[Dict[str, Any]]:
        """
        Run full background analysis on a case.
        """
        logger.info(f"[BackgroundAgent] Starting analysis for case {case_id}")
        
        insights = []
        
        # Run analysis tasks in parallel
        results = await asyncio.gather(
            self._find_timeline_gaps(case_id),
            self._find_missing_evidence(case_id),
            self._find_contradictions(case_id),
            return_exceptions=True
        )
        
        for result in results:
            if isinstance(result, list):
                insights.extend(result)
            elif isinstance(result, Exception):
                logger.error(f"[BackgroundAgent] Analysis task failed: {result}")

        # Persist insights to CaseMemoryStore
        try:
            memory = self.memory_store.load(case_id)
            existing_insights = memory.get("proactive_insights", [])
            
            # Simple dedup based on description
            existing_descs = {i['description'] for i in existing_insights}
            new_insights = [asdict(i) for i in insights if i.description not in existing_descs]
            
            if new_insights:
                memory["proactive_insights"] = existing_insights + new_insights
                self.memory_store.save(case_id, memory)
                logger.info(f"[BackgroundAgent] Persisted {len(new_insights)} new insights to memory.")
        except Exception as e:
            logger.error(f"[BackgroundAgent] Failed to persist insights: {e}")

        logger.info(f"[BackgroundAgent] Analysis complete. Found {len(insights)} insights.")
        return [asdict(i) for i in insights]

    async def _find_timeline_gaps(self, case_id: str) -> List[Insight]:
        """
        Analyze timeline for significant gaps.
        """
        insights = []
        try:
            timeline = self.timeline_service.get_timeline(case_id)
            if len(timeline) < 2:
                return []

            # Sort by date
            sorted_events = sorted(timeline, key=lambda x: x.get('event_date', ''))
            
            # Simple heuristic: Gaps > 7 days in a dense timeline
            # In a real implementation, we'd use LLM to judge "significant" gaps
            for i in range(len(sorted_events) - 1):
                e1 = sorted_events[i]
                e2 = sorted_events[i+1]
                
                d1 = datetime.fromisoformat(e1['event_date'].replace('Z', '+00:00'))
                d2 = datetime.fromisoformat(e2['event_date'].replace('Z', '+00:00'))
                
                delta = d2 - d1
                if delta.days > 7:
                    insights.append(Insight(
                        type="gap",
                        confidence=0.8,
                        description=f"Significant timeline gap of {delta.days} days between {e1['title']} and {e2['title']}.",
                        action_item=f"Investigate activities between {d1.date()} and {d2.date()}.",
                        source_ids=[e1.get('id'), e2.get('id')]
                    ))
                    
        except Exception as e:
            logger.error(f"Timeline gap analysis failed: {e}")
            
        return insights

    async def _find_missing_evidence(self, case_id: str) -> List[Insight]:
        """
        Use LLM to infer missing documents based on existing ones.
        """
        insights = []
        try:
            # Get recent documents to analyze context
            # For MVP, we'll just look at the graph context
            context = await self.kg_service.get_case_context(case_id)
            
            if not context or 'entities' not in context:
                return []

            # Ask LLM to find missing links
            prompt = f"""
            Analyze these entities and relationships from a legal case:
            {str(context)[:2000]}
            
            Identify 1-2 pieces of evidence that SHOULD exist but are not explicitly mentioned.
            For example, if there is a "Reply Email", there must be an "Original Email".
            If there is a "Bank Transfer", there should be a "Bank Statement".
            
            Return ONLY a JSON list of objects with keys: description, action_item.
            """
            
            response = await self.llm_service.generate_json(prompt)
            
            for item in response:
                insights.append(Insight(
                    type="missing_evidence",
                    confidence=0.7,
                    description=item.get('description', 'Suspected missing evidence'),
                    action_item=item.get('action_item', 'Search for this document'),
                    source_ids=[]
                ))

        except Exception as e:
            logger.error(f"Missing evidence analysis failed: {e}")
            
        return insights

    async def _find_contradictions(self, case_id: str) -> List[Insight]:
        """
        Check for logical contradictions in the knowledge graph.
        """
        # Placeholder for more complex logic
        # In a full build, this would query the graph for conflicting statements
        return []
