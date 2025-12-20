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
    
    def __init__(self, llm_service, name: str, kg_service=None):
        self.llm_service = llm_service
        self.kg_service = kg_service
        self.name = name
    
    async def research(self, query: str, context: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError


class CourtListenerResearchAgent(ResearchAgent):
    """Agent that searches CourtListener for relevant case law"""
    
    def __init__(self, llm_service, kg_service=None):
        super().__init__(llm_service, "CourtListenerAgent", kg_service)
    
    async def research(self, query: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Search CourtListener for relevant cases"""
        from backend.app.services.autonomous_courtlistener_service import AutonomousCourtListenerService
        
        try:
            cl_service = AutonomousCourtListenerService(kg_service=self.kg_service)
            
            # Generate search queries from document context
            search_terms = await self._generate_search_terms(query, context)
            
            results = []
            for term in search_terms[:3]:  # Limit to 3 searches
                # Use monitor for persistent tracking
                monitor = await cl_service.add_monitor(
                    monitor_type='keyword',
                    value=term,
                    requested_by='research_swarm',
                    check_interval_hours=24
                )
                # Execute immediate search
                result = await cl_service.execute_monitor(monitor.monitor_id)
                if result.get('success'):
                    results.extend(result.get('results', []))
            
            logger.info(f"{self.name} found {len(results)} cases")
            return {
                "agent": self.name,
                "query": query,
                "results": results[:10],
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
            return [query]


class CaliforniaCodesResearchAgent(ResearchAgent):
    """Agent that searches California statutes and codes"""
    
    def __init__(self, llm_service, kg_service=None):
        super().__init__(llm_service, "CaliforniaCodesAgent", kg_service)
    
    async def research(self, query: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Search California codes for relevant statutes"""
        from backend.app.services.web_scrapers.california_codes_scraper import CaliforniaCodesScraper
        
        try:
            scraper = CaliforniaCodesScraper(kg_service=self.kg_service)
            results = await scraper.search_codes(query)
            
            # If we found a code, try to get specific sections
            case_id = context.get("case_id")
            detailed_results = []
            
            for result in results[:3]:
                if "lawCode" in str(result.get("url", "")):
                    # Try to get specific sections related to query
                    if case_id and self.kg_service:
                        await scraper.upsert_to_knowledge_graph(result, case_id)
                    detailed_results.append(result)
            
            logger.info(f"{self.name} found {len(detailed_results)} statutes")
            return {
                "agent": self.name,
                "query": query,
                "results": detailed_results,
                "status": "success"
            }
        except Exception as e:
            logger.error(f"{self.name} research failed: {e}")
            return {"agent": self.name, "status": "error", "error": str(e)}


class FederalCodesResearchAgent(ResearchAgent):
    """Agent that searches Federal USC codes"""
    
    def __init__(self, llm_service, kg_service=None):
        super().__init__(llm_service, "FederalCodesAgent", kg_service)
    
    async def research(self, query: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Search Federal codes (USC) for relevant statutes"""
        from backend.app.services.web_scrapers.federal_codes_scraper import FederalCodesScraper
        
        try:
            scraper = FederalCodesScraper(kg_service=self.kg_service)
            results = await scraper.search_codes(query)
            
            case_id = context.get("case_id")
            
            # Upsert results to KG
            for result in results[:5]:
                if result.get("usc_title") and result.get("section") and case_id:
                    section_data = await scraper.get_section(
                        int(result["usc_title"]),
                        result["section"]
                    )
                    if section_data:
                        await scraper.upsert_to_knowledge_graph(section_data, case_id)
            
            logger.info(f"{self.name} found {len(results)} statutes")
            return {
                "agent": self.name,
                "query": query,
                "results": results[:10],
                "status": "success"
            }
        except Exception as e:
            logger.error(f"{self.name} research failed: {e}")
            return {"agent": self.name, "status": "error", "error": str(e)}


class ResearchSwarm:
    """
    Orchestrates multiple research agents to autonomously gather
    legal information after document ingestion.
    
    Agents:
    - CourtListenerResearchAgent: Case law from CourtListener API
    - CaliforniaCodesResearchAgent: CA statutes from leginfo.legislature.ca.gov
    - FederalCodesResearchAgent: USC from Cornell LII
    """
    
    def __init__(self):
        self.llm_service = get_llm_service()
        self.kg_service = get_knowledge_graph_service()
        
        # Initialize research agents with KG integration
        self.agents = [
            CourtListenerResearchAgent(self.llm_service, self.kg_service),
            CaliforniaCodesResearchAgent(self.llm_service, self.kg_service),
            FederalCodesResearchAgent(self.llm_service, self.kg_service),
        ]
        
        logger.info(f"ResearchSwarm initialized with {len(self.agents)} agents: "
                   f"{[a.name for a in self.agents]}")
    
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
        """
        Add research findings to the knowledge graph.
        Creates ResearchFinding nodes and links them to the case and source documents.
        """
        from uuid import uuid4
        
        if not self.kg_service:
            logger.warning("No KG service available - skipping research graph update")
            return
        
        findings_added = 0
        
        try:
            for agent_result in results.get("agent_results", []):
                if agent_result.get("status") != "success":
                    continue
                    
                agent_name = agent_result.get("agent", "unknown")
                
                for finding in agent_result.get("results", []):
                    try:
                        # Generate unique ID for this finding
                        finding_id = f"research_{case_id}_{uuid4().hex[:8]}"
                        
                        # Extract finding properties
                        props = {
                            "id": finding_id,
                            "case_id": case_id,
                            "source_agent": agent_name,
                            "title": finding.get("name") or finding.get("title") or finding.get("case_name", ""),
                            "citation": finding.get("citation", ""),
                            "summary": str(finding.get("summary") or finding.get("excerpt", ""))[:1000],
                            "url": finding.get("url") or finding.get("absolute_url", ""),
                            "relevance_score": float(finding.get("relevance", finding.get("similarity_score", 0.5))),
                            "finding_type": self._classify_finding_type(finding, agent_name),
                            "jurisdiction": finding.get("jurisdiction", finding.get("court", "")),
                            "date_found": finding.get("date_filed", finding.get("date", "")),
                        }
                        
                        # Add entity to knowledge graph
                        await self.kg_service.add_entity("ResearchFinding", props)
                        
                        # Link finding to case (create case node if needed)
                        case_props = {"id": f"case_{case_id}", "case_id": case_id}
                        await self.kg_service.add_entity("Case", case_props)
                        
                        await self.kg_service.add_relationship(
                            from_entity_id=f"case_{case_id}",
                            from_entity_type="Case",
                            to_entity_id=finding_id,
                            to_entity_type="ResearchFinding",
                            relationship_type="HAS_RESEARCH",
                            properties={"discovered_by": agent_name}
                        )
                        
                        # Link to source document if available
                        doc_id = results.get("doc_id")
                        if doc_id:
                            await self.kg_service.add_relationship(
                                from_entity_id=doc_id,
                                from_entity_type="Document",
                                to_entity_id=finding_id,
                                to_entity_type="ResearchFinding",
                                relationship_type="TRIGGERED_RESEARCH",
                                properties={}
                            )
                        
                        findings_added += 1
                        logger.debug(f"Added research finding to graph: {finding_id}")
                        
                    except Exception as e:
                        logger.warning(f"Failed to add single finding to graph: {e}")
                        continue
            
            logger.info(f"ResearchSwarm added {findings_added} findings to knowledge graph for case {case_id}")
            
        except Exception as e:
            logger.error(f"Failed to add research to graph: {e}", exc_info=True)
    
    def _classify_finding_type(self, finding: Dict[str, Any], agent_name: str) -> str:
        """Classify the type of research finding based on source and content."""
        if "courtlistener" in agent_name.lower():
            return "case_law"
        elif "california" in agent_name.lower():
            return "state_statute"
        elif "federal" in agent_name.lower():
            return "federal_code"
        elif finding.get("type"):
            return finding["type"]
        return "legal_reference"


# Factory function
_research_swarm: Optional[ResearchSwarm] = None

def get_research_swarm() -> ResearchSwarm:
    global _research_swarm
    if _research_swarm is None:
        _research_swarm = ResearchSwarm()
    return _research_swarm

