"""
Fact Pattern Service - Extracts factual patterns from case evidence.
Identifies Who, What, When, Where, How patterns from the Knowledge Graph.
"""

import logging
import json
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from pathlib import Path

from backend.app.config import get_settings
from backend.app.services.llm_service import get_llm_service
from backend.app.services.knowledge_graph_service import get_knowledge_graph_service

logger = logging.getLogger(__name__)


class FactPattern(BaseModel):
    """A structured fact pattern extracted from evidence."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    pattern_type: str  # who, what, when, where, how, relationship, transaction, communication
    description: str
    confidence: float = Field(ge=0.0, le=1.0)
    supporting_docs: List[str] = Field(default_factory=list)
    entities_involved: List[str] = Field(default_factory=list)
    date_range: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class FactPatternService:
    """
    Extracts and manages fact patterns from case evidence.
    Uses KG data and LLM analysis to identify key factual assertions.
    """
    
    def __init__(self):
        settings = get_settings()
        self.storage_path = Path(settings.case_storage_path) / "fact_patterns"
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self.llm_service = get_llm_service()
        self.kg_service = get_knowledge_graph_service()
    
    def _get_patterns_path(self, case_id: str) -> Path:
        return self.storage_path / f"patterns_{case_id}.json"
    
    def _read_patterns(self, case_id: str) -> List[FactPattern]:
        path = self._get_patterns_path(case_id)
        if not path.exists():
            return []
        with open(path, 'r') as f:
            data = json.load(f)
        return [FactPattern(**p) for p in data]
    
    def _write_patterns(self, case_id: str, patterns: List[FactPattern]):
        path = self._get_patterns_path(case_id)
        with open(path, 'w') as f:
            json.dump([p.model_dump() for p in patterns], f, indent=2, default=str)
    
    async def extract_patterns(self, case_id: str) -> List[FactPattern]:
        """
        Analyzes case evidence and extracts key fact patterns.
        Returns newly extracted patterns.
        """
        logger.info(f"Extracting fact patterns for case {case_id}")
        
        # Query KG for case context
        kg_context = await self._get_kg_context(case_id)
        
        if not kg_context:
            logger.warning(f"No KG context found for case {case_id}")
            return []
        
        # Use LLM to identify fact patterns
        prompt = f"""Analyze the following case evidence data and identify key FACT PATTERNS.

Case Evidence Data:
{json.dumps(kg_context, indent=2, default=str)}

For each fact pattern, identify:
1. pattern_type: (who, what, when, where, how, relationship, transaction, communication, dispute, agreement)
2. description: Clear, factual statement of what occurred
3. confidence: 0.0-1.0 based on evidence strength
4. entities_involved: Names of people, organizations, or things involved
5. date_range: If temporal, when did this occur (approximate)

Return as JSON array:
[
  {{
    "pattern_type": "relationship",
    "description": "John Smith and Acme Corp had an employment relationship",
    "confidence": 0.95,
    "entities_involved": ["John Smith", "Acme Corp"],
    "date_range": "2020-2023"
  }},
  ...
]

Focus on the MOST IMPORTANT 5-10 fact patterns that would be essential to understanding this case.
Ensure output is valid JSON.
"""
        
        try:
            response = await self.llm_service.generate_text(prompt)
            
            # Parse JSON from response
            if "```json" in response:
                response = response.split("```json")[1].split("```")[0]
            elif "```" in response:
                response = response.split("```")[1].split("```")[0]
            
            raw_patterns = json.loads(response.strip())
            
            # Convert to FactPattern objects
            patterns = []
            for rp in raw_patterns:
                pattern = FactPattern(
                    pattern_type=rp.get("pattern_type", "unknown"),
                    description=rp.get("description", ""),
                    confidence=float(rp.get("confidence", 0.5)),
                    entities_involved=rp.get("entities_involved", []),
                    date_range=rp.get("date_range"),
                    supporting_docs=rp.get("supporting_docs", []),
                    metadata={"source": "auto_extraction"}
                )
                patterns.append(pattern)
            
            # Merge with existing patterns
            existing = self._read_patterns(case_id)
            all_patterns = existing + patterns
            self._write_patterns(case_id, all_patterns)
            
            logger.info(f"Extracted {len(patterns)} new fact patterns for case {case_id}")
            return patterns
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM response: {e}")
            return []
        except Exception as e:
            logger.error(f"Fact pattern extraction failed: {e}")
            return []
    
    async def _get_kg_context(self, case_id: str) -> Dict[str, Any]:
        """Retrieves relevant KG data for pattern extraction."""
        try:
            # Get entities
            entity_query = """
            MATCH (n)
            WHERE n.case_id = $case_id OR n:Document OR n:Person OR n:Organization OR n:Event
            RETURN labels(n) as labels, properties(n) as props
            LIMIT 50
            """
            entities = await self.kg_service.run_cypher_query(entity_query, {"case_id": case_id})
            
            # Get relationships
            rel_query = """
            MATCH (a)-[r]->(b)
            WHERE a.case_id = $case_id OR b.case_id = $case_id
            RETURN labels(a) as from_labels, type(r) as rel_type, labels(b) as to_labels,
                   properties(a) as from_props, properties(b) as to_props
            LIMIT 50
            """
            relationships = await self.kg_service.run_cypher_query(rel_query, {"case_id": case_id})
            
            return {
                "entities": entities or [],
                "relationships": relationships or []
            }
        except Exception as e:
            logger.error(f"Failed to get KG context: {e}")
            return {}
    
    def get_patterns(self, case_id: str) -> List[FactPattern]:
        """Returns all fact patterns for a case."""
        return self._read_patterns(case_id)
    
    def add_pattern(self, case_id: str, pattern: FactPattern) -> FactPattern:
        """Manually add a fact pattern."""
        patterns = self._read_patterns(case_id)
        patterns.append(pattern)
        self._write_patterns(case_id, patterns)
        return pattern
    
    def update_pattern(self, case_id: str, pattern_id: str, updates: Dict[str, Any]) -> Optional[FactPattern]:
        """Update an existing fact pattern."""
        patterns = self._read_patterns(case_id)
        for i, p in enumerate(patterns):
            if p.id == pattern_id:
                updated = p.model_copy(update=updates)
                patterns[i] = updated
                self._write_patterns(case_id, patterns)
                return updated
        return None
    
    def delete_pattern(self, case_id: str, pattern_id: str) -> bool:
        """Delete a fact pattern."""
        patterns = self._read_patterns(case_id)
        original_len = len(patterns)
        patterns = [p for p in patterns if p.id != pattern_id]
        if len(patterns) < original_len:
            self._write_patterns(case_id, patterns)
            return True
        return False


def get_fact_pattern_service() -> FactPatternService:
    """Dependency injection helper."""
    return FactPatternService()
