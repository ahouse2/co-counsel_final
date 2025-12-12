"""
Research Swarm - Autonomous legal research orchestrator.
Spawns after document ingestion to search external legal databases.
"""
import logging
from typing import List, Dict, Any, Optional
import asyncio

from backend.app.services.llm_service import get_llm_service
from backend.app.services.knowledge_graph_service import get_knowledge_graph_service

logger = logging.getLogger(__name__)


class ResearchAgent:
    """Base agent for legal research tasks"""
    
    def __init__(self, llm_service, name: str):
        self.llm_service = llm_service
        self.name = name
    
    async def research(self, query: str, context: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError


class CourtListenerResearchAgent(ResearchAgent):
    """Agent that searches CourtListener for relevant case law"""
    
    def __init__(self, llm_service):
        super().__init__(llm_service, "CourtListenerAgent")
    
    async def research(self, query: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Search CourtListener for relevant cases"""
        from backend.app.services.autonomous_courtlistener_service import AutonomousCourtListenerService
        
        try:
            cl_service = AutonomousCourtListenerService()
            
            # Generate search queries from document context
            search_terms = await self._generate_search_terms(query, context)
            
            results = []
            for term in search_terms[:3]:  # Limit to 3 searches
                cases = await cl_service.search_cases(term, limit=5)
                results.extend(cases)
            
            logger.info(f"{self.name} found {len(results)} cases")
            return {
                "agent": self.name,
                "query": query,
                "results": results[:10],  # Top 10
                "status": "success"
            }
        except Exception as e:
            logger.error(f"{self.name} research failed: {e}")
            return {"agent": self.name, "status": "error", "error": str(e)}
    
    async def _generate_search_terms(self, query: str, context: Dict[str, Any]) -> List[str]:
        """Use LLM to generate effective search terms"""
        prompt = f"""Generate 3 effective legal database search terms for this query.
        
Query: {query}
Document Type: {context.get('doc_type', 'Unknown')}
Tags: {context.get('tags', [])}

Return as JSON array of strings, e.g.: ["term 1", "term 2", "term 3"]
"""
        try:
            response = await self.llm_service.generate_text(prompt)
            import json
            if "```" in response:
                response = response.split("```")[1].split("```")[0]
                if response.startswith("json"):
                    response = response[4:]
            return json.loads(response.strip())
        except:
            # Fallback: use query directly
            return [query]


class LegalNewsResearchAgent(ResearchAgent):
    """Agent that searches for legal news and updates"""
    
    def __init__(self, llm_service):
        super().__init__(llm_service, "LegalNewsAgent")
    
    async def research(self, query: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Search for legal news (simulated - would use real API)"""
        # In production, this would hit a legal news API
        logger.info(f"{self.name} searching for: {query}")
        
        # Placeholder results
        return {
            "agent": self.name,
            "query": query,
            "results": [],
            "status": "success",
            "note": "Legal news API integration pending"
        }


class ResearchSwarm:
    """
    Orchestrates multiple research agents to autonomously gather
    legal information after document ingestion.
    """
    
    def __init__(self):
        self.llm_service = get_llm_service()
        self.kg_service = get_knowledge_graph_service()
        
        # Initialize research agents
        self.agents = [
            CourtListenerResearchAgent(self.llm_service),
            LegalNewsResearchAgent(self.llm_service),
        ]
        
        logger.info(f"ResearchSwarm initialized with {len(self.agents)} agents")
    
    async def research_for_document(
        self, 
        doc_id: str, 
        doc_text: str, 
        metadata: Dict[str, Any],
        case_id: str
    ) -> Dict[str, Any]:
        """
        Triggers research swarm for a newly ingested document.
        Runs all research agents in parallel.
        """
        logger.info(f"ResearchSwarm triggered for doc {doc_id}")
        
        # Generate research query from document
        query = await self._generate_research_query(doc_text, metadata)
        
        context = {
            "doc_id": doc_id,
            "case_id": case_id,
            "doc_type": metadata.get("doc_type", "unknown"),
            "tags": metadata.get("ai_tags", []),
        }
        
        # Run all agents in parallel
        tasks = [agent.research(query, context) for agent in self.agents]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Compile results
        compiled_results = {
            "doc_id": doc_id,
            "case_id": case_id,
            "query": query,
            "agent_results": []
        }
        
        for result in results:
            if isinstance(result, Exception):
                compiled_results["agent_results"].append({
                    "status": "error",
                    "error": str(result)
                })
            else:
                compiled_results["agent_results"].append(result)
        
        # Add findings to knowledge graph
        await self._add_to_knowledge_graph(compiled_results, case_id)
        
        logger.info(f"ResearchSwarm completed for doc {doc_id}")
        return compiled_results
    
    async def _generate_research_query(self, text: str, metadata: Dict[str, Any]) -> str:
        """Generate a research query from document content"""
        prompt = f"""Based on this legal document, generate a single research query to find relevant case law and legal precedents.

Document Type: {metadata.get('doc_type', 'Unknown')}
Summary: {metadata.get('ai_summary', {}).get('brief_summary', text[:500])}

Generate a concise legal research query (one sentence):"""

        try:
            response = await self.llm_service.generate_text(prompt)
            return response.strip()[:200]  # Limit length
        except:
            return f"Legal research for {metadata.get('doc_type', 'document')}"
    
    async def _add_to_knowledge_graph(self, results: Dict[str, Any], case_id: str):
        """Add research findings to the knowledge graph"""
        try:
            # Create nodes for each research finding
            for agent_result in results.get("agent_results", []):
                if agent_result.get("status") == "success":
                    for finding in agent_result.get("results", []):
                        # Add as a node linked to the case
                        logger.debug(f"Would add to graph: {finding}")
        except Exception as e:
            logger.error(f"Failed to add research to graph: {e}")


# Factory function
_research_swarm: Optional[ResearchSwarm] = None

def get_research_swarm() -> ResearchSwarm:
    global _research_swarm
    if _research_swarm is None:
        _research_swarm = ResearchSwarm()
    return _research_swarm
