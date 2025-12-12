"""
Relation Miner Agent - Discovers relationships between entities in documents.
"""
import logging
from typing import List, Dict, Any, Tuple

logger = logging.getLogger(__name__)


class RelationMinerAgent:
    """
    Agent that analyzes documents to discover relationships between entities,
    then adds them to the knowledge graph.
    """
    
    def __init__(self, llm_service, graph_service=None):
        self.llm_service = llm_service
        self.graph_service = graph_service
    
    async def extract_relations(self, text: str, doc_id: str, metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Extracts entity relationships from document text.
        
        Returns:
            List of relation dicts with: subject, predicate, object, confidence
        """
        if not text or len(text) < 100:
            logger.warning("Text too short for relation extraction")
            return []
        
        prompt = f"""You are a legal knowledge graph expert. Extract relationships between entities from this document.

DOCUMENT TEXT (first 4000 chars):
{text[:4000]}

INSTRUCTIONS:
1. Identify key entities (people, organizations, dates, locations, legal concepts)
2. Find relationships between these entities
3. Return as JSON array of objects

OUTPUT FORMAT:
[
  {{"subject": "John Doe", "predicate": "signed", "object": "Employment Contract", "confidence": 0.95}},
  {{"subject": "ABC Corp", "predicate": "employed", "object": "John Doe", "confidence": 0.9}},
  {{"subject": "Contract", "predicate": "dated", "object": "2023-01-15", "confidence": 0.85}}
]

RELATIONSHIP TYPES TO LOOK FOR:
- Party relationships (signed, filed, represented, employed)
- Document relationships (references, amends, supersedes)
- Temporal relationships (dated, effective, terminated)
- Legal relationships (violated, complied, breached)

Extract relationships now (JSON only):"""

        try:
            response = await self._complete_async(prompt)
            text_response = response.text if hasattr(response, 'text') else str(response)
            
            # Parse JSON
            import json
            if "```json" in text_response:
                text_response = text_response.split("```json")[1].split("```")[0]
            elif "```" in text_response:
                text_response = text_response.split("```")[1].split("```")[0]
            
            relations = json.loads(text_response.strip())
            
            if isinstance(relations, list):
                logger.info(f"Extracted {len(relations)} relations from {doc_id}")
                
                # Add to knowledge graph if service available
                if self.graph_service:
                    await self._add_to_graph(relations, doc_id)
                
                return relations
            return []
            
        except Exception as e:
            logger.error(f"Relation extraction failed: {e}", exc_info=True)
            return []
    
    async def _add_to_graph(self, relations: List[Dict[str, Any]], doc_id: str):
        """Adds extracted relations to the knowledge graph"""
        try:
            for rel in relations:
                subject = rel.get("subject", "")
                predicate = rel.get("predicate", "")
                obj = rel.get("object", "")
                confidence = rel.get("confidence", 0.5)
                
                if subject and predicate and obj:
                    # Create nodes and edge
                    # This is a simplified version - real implementation would use graph_service methods
                    logger.debug(f"Would add to graph: ({subject})-[{predicate}]->({obj})")
                    
        except Exception as e:
            logger.error(f"Failed to add relations to graph: {e}")
    
    async def _complete_async(self, prompt: str):
        """Wrapper to handle sync/async LLM calls"""
        import asyncio
        if hasattr(self.llm_service, 'acomplete'):
            return await self.llm_service.acomplete(prompt)
        else:
            return await asyncio.to_thread(self.llm_service.complete, prompt)
