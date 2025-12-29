"""
Asset Hunter Swarm - Autonomous asset discovery and financial forensics with KG integration.

Agents:
1. EntitySearchAgent - Finds related entities (companies, trusts, people)
2. PropertySearchAgent - Searches for real property holdings
3. CryptoTracingAgent - Traces cryptocurrency transactions
4. FinancialDiscrepancyAgent - Identifies lifestyle/income discrepancies
5. SchemeDetectorAgent - Detects asset hiding schemes
"""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from backend.app.services.llm_service import get_llm_service, LLMService
from backend.app.services.knowledge_graph_service import get_knowledge_graph_service, KnowledgeGraphService

logger = logging.getLogger(__name__)


@dataclass
class AssetAgentResult:
    agent_name: str
    success: bool
    output: Dict[str, Any]
    findings_count: int = 0


class AssetAgent:
    """Base class for asset hunter agents."""
    
    def __init__(self, llm_service: LLMService, kg_service: KnowledgeGraphService, name: str):
        self.llm_service = llm_service
        self.kg_service = kg_service
        self.name = name
    
    async def investigate(self, target: str, context: Dict[str, Any]) -> AssetAgentResult:
        raise NotImplementedError


class EntitySearchAgent(AssetAgent):
    """Agent 1: Finds related entities."""
    
    def __init__(self, llm_service: LLMService, kg_service: KnowledgeGraphService):
        super().__init__(llm_service, kg_service, "EntitySearchAgent")
    
    async def investigate(self, target: str, context: Dict[str, Any]) -> AssetAgentResult:
        try:
            case_id = context.get("case_id", "default")
            
            # Query KG for related entities
            entity_query = """
            MATCH (t:Entity {name: $target})-[r]-(related:Entity)
            RETURN related.name as name, related.type as type,
                   type(r) as relationship
            LIMIT 20
            """
            entities = await self.kg_service.run_cypher_query(entity_query, {"target": target})
            
            # Use LLM to analyze connections
            prompt = f"""Analyze this target for asset hiding through entity structures.

TARGET: {target}

KNOWN ENTITIES:
{chr(10).join([f"- {e.get('name')} ({e.get('type')}) - {e.get('relationship')}" for e in (entities or [])[:10]])}

Look for:
1. Shell companies
2. Trusts and LLCs
3. Nominee arrangements
4. Family transfers

Return JSON:
{{
    "related_entities": [{{"name": "...", "type": "...", "suspicion_level": "high|medium|low", "reason": "..."}}],
    "patterns_detected": ["pattern1"],
    "recommended_actions": ["action1"]
}}"""

            response = await self.llm_service.generate_text(prompt)
            import json, re
            match = re.search(r'\{.*\}', response, re.DOTALL)
            if match:
                data = json.loads(match.group())
                return AssetAgentResult(
                    agent_name=self.name,
                    success=True,
                    output=data,
                    findings_count=len(data.get("related_entities", []))
                )
            
            return AssetAgentResult(self.name, False, {"error": "Parse failed"}, 0)
            
        except Exception as e:
            logger.error(f"{self.name} failed: {e}")
            return AssetAgentResult(self.name, False, {"error": str(e)}, 0)


class PropertySearchAgent(AssetAgent):
    """Agent 2: Searches for real property holdings."""
    
    def __init__(self, llm_service: LLMService, kg_service: KnowledgeGraphService):
        super().__init__(llm_service, kg_service, "PropertySearchAgent")
    
    async def investigate(self, target: str, context: Dict[str, Any]) -> AssetAgentResult:
        try:
            # Query KG for property records
            property_query = """
            MATCH (e:Entity {name: $target})-[:OWNS|OWNED|TRANSFERRED]->(p:Property)
            RETURN p.address as address, p.value as value, p.type as type,
                   p.acquisition_date as acquired
            """
            properties = await self.kg_service.run_cypher_query(property_query, {"target": target})
            
            return AssetAgentResult(
                agent_name=self.name,
                success=True,
                output={
                    "properties": properties or [],
                    "total_value": sum([p.get("value", 0) for p in (properties or []) if isinstance(p.get("value"), (int, float))]),
                    "search_sources": ["KnowledgeGraph"]
                },
                findings_count=len(properties or [])
            )
            
        except Exception as e:
            logger.error(f"{self.name} failed: {e}")
            return AssetAgentResult(self.name, False, {"error": str(e)}, 0)



import json
import os
from backend.app.services.crypto_service import CryptoService

# ... (imports remain the same)

class CryptoTracingAgent(AssetAgent):
    """Agent 3: Traces cryptocurrency transactions using CryptoService."""
    
    def __init__(self, llm_service: LLMService, kg_service: KnowledgeGraphService):
        super().__init__(llm_service, kg_service, "CryptoTracingAgent")
        self.crypto_service = CryptoService()
    
    async def investigate(self, target: str, context: Dict[str, Any]) -> AssetAgentResult:
        try:
            case_id = context.get("case_id", "default")
            
            # 1. Query KG for known wallets
            crypto_query = """
            MATCH (e:Entity)-[:HAS_WALLET]->(w:CryptoWallet)
            WHERE e.name CONTAINS $target OR e.case_id = $case_id
            RETURN w.address as address, w.blockchain as chain
            """
            wallets = await self.kg_service.run_cypher_query(crypto_query, {
                "target": target, "case_id": case_id
            })
            
            results = {
                "wallets_found": [],
                "traces": [],
                "total_risk_score": 0.0
            }

            # 2. If wallets found in KG, trace them
            if wallets:
                for w in wallets:
                    address = w.get("address")
                    chain = w.get("chain", "BTC")
                    trace = self.crypto_service.trace_address(address, chain)
                    
                    # Add AI analysis
                    if "error" not in trace:
                        trace["ai_analysis"] = await self.crypto_service.analyze_with_llm(trace)
                        results["traces"].append(trace)
                        results["total_risk_score"] = max(results["total_risk_score"], trace.get("risk_score", 0))
                
                results["wallets_found"] = wallets
            
            # 3. If no wallets, ask LLM to infer from context (e.g. "sent 5 BTC")
            # (Skipped for now to keep it focused on real tracing)

            return AssetAgentResult(
                agent_name=self.name,
                success=True,
                output=results,
                findings_count=len(results["traces"])
            )
            
        except Exception as e:
            logger.error(f"{self.name} failed: {e}")
            return AssetAgentResult(self.name, False, {"error": str(e)}, 0)



class FinancialDiscrepancyAgent(AssetAgent):
    """Agent 4: Identifies lifestyle/income discrepancies."""
    
    def __init__(self, llm_service: LLMService, kg_service: KnowledgeGraphService):
        super().__init__(llm_service, kg_service, "FinancialDiscrepancyAgent")
    
    async def investigate(self, target: str, context: Dict[str, Any]) -> AssetAgentResult:
        try:
            # 1. Calculate Total Asset Value (Properties + Crypto)
            properties = context.get("properties", {}).get("properties", [])
            crypto_traces = context.get("crypto", {}).get("traces", [])
            
            total_property_value = sum([p.get("value", 0) for p in properties if isinstance(p.get("value"), (int, float))])
            total_crypto_value = sum([t.get("final_balance", 0) * 60000 for t in crypto_traces if t.get("chain") == "BTC"]) # Approx BTC price
            # Add ETH value logic if needed
            
            total_known_assets = total_property_value + total_crypto_value

            # 2. Search KG for Income/Employment Data
            income_query = """
            MATCH (p:Person {name: $target})-[:HAS_INCOME|EMPLOYED_BY]->(source)
            RETURN source.name as source, source.amount as amount, source.position as position
            """
            income_records = await self.kg_service.run_cypher_query(income_query, {"target": target})
            
            known_income = 0
            income_sources = []
            if income_records:
                for rec in income_records:
                    amt = rec.get("amount", 0)
                    if isinstance(amt, (int, float)):
                        known_income += amt
                    income_sources.append(f"{rec.get('position')} at {rec.get('source')} (${amt:,})")
            
            # 3. Search Timeline for Financial Events (Salary, Deposits)
            # We can use the context's case_id to query timeline service if we had access, 
            # but for now we'll rely on what the swarm might have gathered or KG.
            
            prompt = f"""
            Analyze financial discrepancy for target: {target}
            
            ASSETS DETECTED:
            - Real Estate: ${total_property_value:,.2f}
            - Crypto Assets: ${total_crypto_value:,.2f}
            - Total Known Assets: ${total_known_assets:,.2f}
            
            KNOWN INCOME SOURCES:
            {chr(10).join(income_sources) if income_sources else "- None found in records"}
            (Total Annual Income: ${known_income:,.2f})
            
            CONTEXT FROM CRYPTO TRACING:
            {json.dumps(context.get("crypto", {}).get("flags", []), indent=2)}
            
            TASK:
            Compare the total asset value against the known income. 
            If assets >>> income (e.g. 10x), flag as HIGH risk "Unexplained Wealth".
            If crypto usage is high but no tech background, flag as suspicious.
            
            Return JSON:
            {{
                "discrepancies": [
                    {{"description": "...", "severity": "high|medium|low", "evidence": "Assets ($X) vs Income ($Y)"}}
                ],
                "risk_score": 0.0 to 1.0
            }}
            """
            
            response = await self.llm_service.generate_text(prompt)
            import re
            match = re.search(r'\{.*\}', response, re.DOTALL)
            data = {}
            if match:
                data = json.loads(match.group())
            
            return AssetAgentResult(
                agent_name=self.name,
                success=True,
                output=data,
                findings_count=len(data.get("discrepancies", []))
            )
            
        except Exception as e:
            logger.error(f"{self.name} failed: {e}")
            return AssetAgentResult(self.name, False, {"error": str(e)}, 0)


class SchemeDetectorAgent(AssetAgent):
    """Agent 5: Detects asset hiding schemes using Forensic Playbook."""
    
    def __init__(self, llm_service: LLMService, kg_service: KnowledgeGraphService):
        super().__init__(llm_service, kg_service, "SchemeDetectorAgent")
        self.knowledge_base = self._load_knowledge_base()

    def _load_knowledge_base(self) -> List[Dict[str, Any]]:
        """Loads the asset schemes knowledge base."""
        try:
            base_path = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            kb_path = os.path.join(base_path, "knowledge", "asset_schemes.json")
            
            if os.path.exists(kb_path):
                with open(kb_path, "r") as f:
                    return json.load(f)
            return []
        except Exception as e:
            logger.error(f"Error loading asset knowledge base: {e}")
            return []
    
    async def investigate(self, target: str, context: Dict[str, Any]) -> AssetAgentResult:
        try:
            entities = context.get("entities", {}).get("related_entities", [])
            properties = context.get("properties", {}).get("properties", [])
            discrepancies = context.get("discrepancies", {}).get("discrepancies", [])
            
            # Use loaded schemes or fallback
            schemes = self.knowledge_base if self.knowledge_base else [
                {"name": "Trust Scheme", "indicators": ["trust", "beneficiary", "trustee"]},
                {"name": "Shell Company", "indicators": ["llc", "inc", "offshore", "delaware"]},
                {"name": "Nominee Ownership", "indicators": ["family member", "employee", "relative"]},
                {"name": "Fraudulent Transfer", "indicators": ["recent transfer", "no consideration", "insider"]}
            ]
            
            detected_schemes = []
            
            # Check entities for scheme patterns
            for entity in entities:
                entity_name = entity.get("name", "").lower()
                entity_type = entity.get("type", "").lower()
                
                for scheme in schemes:
                    indicators = scheme.get("indicators", [])
                    matched_indicators = [ind for ind in indicators if ind in entity_name or ind in entity_type]
                    
                    if matched_indicators:
                        detected_schemes.append({
                            "scheme": scheme.get("name"),
                            "entity": entity.get("name"),
                            "indicators_matched": matched_indicators,
                            "description": scheme.get("description", "Potential asset hiding scheme detected.")
                        })
            
            # Also check discrepancies for scheme indicators
            for disc in discrepancies:
                desc = disc.get("description", "").lower()
                for scheme in schemes:
                     indicators = scheme.get("indicators", [])
                     if any(ind in desc for ind in indicators):
                         detected_schemes.append({
                            "scheme": scheme.get("name"),
                            "entity": "Financial Discrepancy",
                            "indicators_matched": [ind for ind in indicators if ind in desc],
                            "description": f"Discrepancy matches scheme: {disc.get('description')}"
                        })

            return AssetAgentResult(
                agent_name=self.name,
                success=True,
                output={
                    "detected_schemes": detected_schemes,
                    "scheme_count": len(detected_schemes),
                    "risk_level": "high" if len(detected_schemes) > 2 else "medium" if detected_schemes else "low"
                },
                findings_count=len(detected_schemes)
            )
            
        except Exception as e:
            logger.error(f"{self.name} failed: {e}")
            return AssetAgentResult(self.name, False, {"error": str(e)}, 0)

# ... (AssetHunterSwarm class remains mostly the same, just ensuring it uses these updated classes)



# ═══════════════════════════════════════════════════════════════════════════
# ASSET HUNTER SWARM
# ═══════════════════════════════════════════════════════════════════════════

class AssetHunterSwarm:
    """
    Full asset hunting swarm with 5 agents.
    """
    
    def __init__(self, llm_service: Optional[LLMService] = None, kg_service: Optional[KnowledgeGraphService] = None):
        self.llm_service = llm_service or get_llm_service()
        self.kg_service = kg_service or get_knowledge_graph_service()
        
        self.entity_search = EntitySearchAgent(self.llm_service, self.kg_service)
        self.property_search = PropertySearchAgent(self.llm_service, self.kg_service)
        self.crypto_tracing = CryptoTracingAgent(self.llm_service, self.kg_service)
        self.discrepancy_detector = FinancialDiscrepancyAgent(self.llm_service, self.kg_service)
        self.scheme_detector = SchemeDetectorAgent(self.llm_service, self.kg_service)
        
        self.scheme_detector = SchemeDetectorAgent(self.llm_service, self.kg_service)
        
        # For target discovery
        from backend.app.services.timeline import get_timeline_service
        self.timeline_service = get_timeline_service()
        
        logger.info("AssetHunterSwarm initialized with 5 agents")

    async def run_investigation(self, case_id: str) -> Dict[str, Any]:
        """
        Scans the case timeline to identify a primary target, then runs the swarm.
        """
        # 1. Identify Target from Timeline
        try:
            timeline_result = self.timeline_service.list_events(case_id)
            events = timeline_result.events if timeline_result else []
            
            # Simple heuristic: Look for names in financial events
            financial_keywords = ["bank", "transfer", "trust", "llc", "offshore", "crypto", "bitcoin", "wire"]
            relevant_events = [e for e in events if any(k in e.summary.lower() for k in financial_keywords)]
            
            target = "Unknown Subject"
            if relevant_events:
                # Ask LLM to extract the primary financial subject
                context_text = "\n".join([f"- {e.summary}" for e in relevant_events[:20]])
                prompt = f"Extract the name of the primary person or entity involved in these financial events:\n{context_text}\nReturn ONLY the name."
                target = await self.llm_service.generate_text(prompt)
                target = target.strip().strip('"').strip("'")
            
            logger.info(f"Identified primary target for asset hunt: {target}")
            
        except Exception as e:
            logger.error(f"Target identification failed: {e}")
            target = "Case Subject"

        # 2. Run Swarm on Target
        return await self.investigate(target, case_id)
    
    async def investigate(self, target: str, case_id: str) -> Dict[str, Any]:
        """Run full asset investigation."""
        context = {"case_id": case_id}
        
        # Stage 1: Entity and property search (parallel)
        logger.info(f"[AssetHunterSwarm] Investigating target: {target}")
        
        entity_task = self.entity_search.investigate(target, context)
        property_task = self.property_search.investigate(target, context)
        crypto_task = self.crypto_tracing.investigate(target, context)
        
        entity_result, property_result, crypto_result = await asyncio.gather(
            entity_task, property_task, crypto_task
        )
        
        context["entities"] = entity_result.output
        context["properties"] = property_result.output
        context["crypto"] = crypto_result.output
        
        # Stage 2: Discrepancy analysis
        logger.info(f"[AssetHunterSwarm] Analyzing discrepancies")
        discrepancy_result = await self.discrepancy_detector.investigate(target, context)
        context["discrepancies"] = discrepancy_result.output
        
        # Stage 3: Scheme detection
        logger.info(f"[AssetHunterSwarm] Detecting schemes")
        scheme_result = await self.scheme_detector.investigate(target, context)
        
        # Store findings in KG
        total_findings = sum([
            entity_result.findings_count,
            property_result.findings_count,
            crypto_result.findings_count,
            discrepancy_result.findings_count,
            scheme_result.findings_count
        ])
        
        store_query = """
        MERGE (i:Investigation {target: $target, case_id: $case_id})
        SET i.total_findings = $findings,
            i.risk_level = $risk,
            i.completed_at = datetime()
        """
        await self.kg_service.run_cypher_query(store_query, {
            "target": target,
            "case_id": case_id,
            "findings": total_findings,
            "risk": scheme_result.output.get("risk_level", "unknown")
        })
        
        return {
            "target": target,
            "case_id": case_id,
            "entities": entity_result.output,
            "properties": property_result.output,
            "crypto": crypto_result.output,
            "discrepancies": discrepancy_result.output,
            "schemes": scheme_result.output,
            "total_findings": total_findings
        }


# Factory
_asset_hunter_swarm: Optional[AssetHunterSwarm] = None

def get_asset_hunter_swarm() -> AssetHunterSwarm:
    global _asset_hunter_swarm
    if _asset_hunter_swarm is None:
        _asset_hunter_swarm = AssetHunterSwarm()
    return _asset_hunter_swarm
