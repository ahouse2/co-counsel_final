from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, Optional

from .memory import CaseThreadMemory
from backend.app.services.knowledge_graph_service import KnowledgeGraphService, get_knowledge_graph_service


@dataclass(slots=True)
class AgentContext:
    """Execution context flowing across Microsoft Agents SDK graph nodes."""

    case_id: str
    question: str
    top_k: int
    actor: Dict[str, Any]
    memory: CaseThreadMemory
    telemetry: Dict[str, Any] = field(default_factory=dict)
    knowledge_graph_context: Dict[str, Any] = field(default_factory=dict) # New field for KG context

    def with_updates(self, **kwargs: Any) -> AgentContext:
        payload = {**self.__dict__}
        payload.update(kwargs)
        return AgentContext(**payload)

    async def load_knowledge_graph_context(self, kg_service: Optional[KnowledgeGraphService] = None):
        """
        Loads relevant context from the knowledge graph based on the case_id.
        """
        if kg_service is None:
            kg_service = get_knowledge_graph_service() # Get default instance if not provided

        # Assuming KnowledgeGraphService has a method to get case-specific context
        # This method would need to be implemented in knowledge_graph_service.py
        try:
            case_context = await kg_service.get_case_context(self.case_id)
            self.knowledge_graph_context = case_context
        except Exception as e:
            # Log the error, but don't prevent context creation
            print(f"Error loading knowledge graph context for case {self.case_id}: {e}")
            self.knowledge_graph_context = {"error": str(e)}
