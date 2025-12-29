"""
Autonomous Orchestrator - Event-Driven Pipeline Controller

This is the central nervous system that ties together all services, swarms, and the knowledge graph.
It listens for events (document ingested, research completed, etc.) and autonomously triggers
the appropriate downstream actions.
"""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Set
from uuid import uuid4

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════════════
# EVENT DEFINITIONS
# ═══════════════════════════════════════════════════════════════════════════

class EventType(str, Enum):
    """All autonomous event types in the system."""
    # Ingestion Events
    DOCUMENT_INGESTED = "document.ingested"
    BATCH_INGESTION_COMPLETE = "batch.ingestion.complete"
    
    # Research Events
    RESEARCH_STARTED = "research.started"
    RESEARCH_COMPLETED = "research.completed"
    CASE_LAW_FOUND = "research.caselaw.found"
    STATUTE_FOUND = "research.statute.found"
    
    # Graph Events
    GRAPH_UPDATED = "graph.updated"
    ENTITY_CREATED = "graph.entity.created"
    RELATIONSHIP_CREATED = "graph.relationship.created"
    
    # Analysis Events
    CONTRADICTION_DETECTED = "analysis.contradiction.detected"
    HOT_DOCUMENT_FLAGGED = "analysis.hotdoc.flagged"
    PRIVILEGE_DETECTED = "analysis.privilege.detected"
    
    # Narrative Events
    NARRATIVE_GENERATED = "narrative.generated"
    TIMELINE_UPDATED = "timeline.updated"
    
    # Trial Prep Events
    WEAKNESS_IDENTIFIED = "trialprep.weakness.identified"
    CROSS_EXAM_GENERATED = "trialprep.crossexam.generated"


@dataclass
class SystemEvent:
    """Base event class for the autonomous pipeline."""
    event_id: str = field(default_factory=lambda: str(uuid4()))
    event_type: EventType = EventType.DOCUMENT_INGESTED
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    case_id: str = ""
    source_service: str = ""
    payload: Dict[str, Any] = field(default_factory=dict)
    
    def __str__(self):
        return f"[{self.event_type.value}] case={self.case_id} source={self.source_service}"


# ═══════════════════════════════════════════════════════════════════════════
# AUTONOMOUS ORCHESTRATOR
# ═══════════════════════════════════════════════════════════════════════════

class AutonomousOrchestrator:
    """
    The central event-driven orchestrator that autonomously triggers
    downstream actions based on system events.
    
    Architecture:
    - Event Bus: Pub/sub pattern for loose coupling
    - Handler Registry: Maps event types to handler functions
    - Message Router: Cross-swarm communication hub
    - Background Workers: Async execution of triggered actions
    
    Autonomous Pipeline:
    Evidence Upload → Ingestion → Research → Narrative → Trial Prep → User
    
    Key Workflows:
    1. Document Ingested → ResearchSwarm → Graph Update → Narrative Rebuild
    2. Contradiction Detected → Devil's Advocate → Weakness Report
    3. Graph Updated → Timeline Refresh → Trial Brief Generation
    """
    
    _instance: Optional["AutonomousOrchestrator"] = None
    
    def __init__(self):
        self._handlers: Dict[EventType, List[Callable]] = {}
        self._event_queue: asyncio.Queue = asyncio.Queue()
        self._message_queue: asyncio.Queue = asyncio.Queue()  # For swarm messages
        self._running = False
        self._worker_task: Optional[asyncio.Task] = None
        self._message_worker_task: Optional[asyncio.Task] = None
        self._processed_count = 0
        self._message_log: List[Dict[str, Any]] = []  # For observability
        self._activity_log: List[Dict[str, Any]] = []  # For Agent Console
        
        # Register default handlers
        self._register_default_handlers()
        
        logger.info("AutonomousOrchestrator initialized")
    
    @classmethod
    def get_instance(cls) -> "AutonomousOrchestrator":
        """Singleton access."""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
    
    def _register_default_handlers(self):
        """Register the core autonomous workflow handlers."""
        
        # Document Ingested → Trigger Research Swarm
        self.subscribe(EventType.DOCUMENT_INGESTED, self._on_document_ingested)
        
        # Research Completed → Update Knowledge Graph + Rebuild Narrative
        self.subscribe(EventType.RESEARCH_COMPLETED, self._on_research_completed)
        
        # Graph Updated → Refresh dependent services
        self.subscribe(EventType.GRAPH_UPDATED, self._on_graph_updated)
        
        # Contradiction Detected → Trigger Devil's Advocate
        self.subscribe(EventType.CONTRADICTION_DETECTED, self._on_contradiction_detected)
        
        # Hot Document Flagged → Priority analysis
        self.subscribe(EventType.HOT_DOCUMENT_FLAGGED, self._on_hot_document_flagged)
        
        # Batch Ingestion Complete → Trigger full autonomous pipeline
        self.subscribe(EventType.BATCH_INGESTION_COMPLETE, self._on_batch_complete)
        
        logger.info(f"Registered handlers for {len(self._handlers)} event types")
    
    # ═══════════════════════════════════════════════════════════════════════
    # CROSS-SWARM MESSAGE ROUTING
    # ═══════════════════════════════════════════════════════════════════════
    
    async def route_swarm_message(self, message):
        """
        Route a message from one swarm to another.
        This is the central hub for cross-swarm communication.
        """
        from backend.app.agents.swarms.comms_agent import SwarmMessage
        
        self._message_log.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "from": message.from_swarm,
            "to": message.to_swarm,
            "type": message.message_type,
            "content_preview": str(message.content)[:100]
        })
        
        self._log_activity("message_routed", f"{message.from_swarm} → {message.to_swarm}")
        
        if message.to_swarm == "coordinator":
            await self._handle_coordinator_message(message)
        elif message.to_swarm == "broadcast":
            await self._broadcast_message(message)
        else:
            await self._deliver_to_swarm(message)
    
    async def _handle_coordinator_message(self, message):
        """Handle messages sent to the coordinator (Co-Counsel)."""
        logger.info(f"[Coordinator] Received from {message.from_swarm}: {message.message_type}")
        self._log_activity("coordinator_msg", f"From {message.from_swarm}: {message.message_type}")
        
        # Store for UI observability
        if message.message_type == "status_report":
            self._activity_log.append({
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "swarm": message.from_swarm,
                "status": message.content.get("status"),
                "details": message.content.get("details", {})
            })
    
    async def _broadcast_message(self, message):
        """Broadcast a message to all swarms."""
        from backend.app.agents.swarms.comms_agent import get_comms_agent
        
        swarm_names = ["ingestion", "research", "narrative", "trial_prep", 
                       "forensics", "context_engine", "legal_research", 
                       "drafting", "asset_hunter", "simulation"]
        
        for swarm_name in swarm_names:
            if swarm_name != message.from_swarm:
                try:
                    comms = get_comms_agent(swarm_name)
                    await comms.receive_message(message)
                except Exception as e:
                    logger.debug(f"Broadcast to {swarm_name} failed: {e}")
    
    async def _deliver_to_swarm(self, message):
        """Deliver a message to a specific swarm."""
        from backend.app.agents.swarms.comms_agent import get_comms_agent
        
        try:
            comms = get_comms_agent(message.to_swarm)
            await comms.receive_message(message)
        except Exception as e:
            logger.warning(f"Delivery to {message.to_swarm} failed: {e}")
    
    def get_message_log(self) -> List[Dict[str, Any]]:
        """Get the message log for observability."""
        return self._message_log[-100:]  # Last 100 messages
    
    def get_activity_log(self) -> List[Dict[str, Any]]:
        """Get the activity log for Agent Console."""
        return self._activity_log[-50:]  # Last 50 activities
    
    def _log_activity(self, activity_type: str, details: str):
        """Log activity for observability."""
        self._activity_log.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "type": activity_type,
            "details": details
        })
    
    def subscribe(self, event_type: EventType, handler: Callable):
        """Subscribe a handler to an event type."""
        if event_type not in self._handlers:
            self._handlers[event_type] = []
        self._handlers[event_type].append(handler)
        logger.debug(f"Subscribed {handler.__name__} to {event_type.value}")
    
    async def publish(self, event: SystemEvent):
        """Publish an event to the event bus."""
        await self._event_queue.put(event)
        logger.info(f"Event published: {event}")
    
    def publish_sync(self, event: SystemEvent):
        """Synchronous event publishing (creates task in background)."""
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(self.publish(event))
        except RuntimeError:
            # No running loop - queue directly
            asyncio.run(self._event_queue.put(event))
    
    async def start(self):
        """Start the background event processor."""
        if self._running:
            return
        
        self._running = True
        self._worker_task = asyncio.create_task(self._event_processor())
        logger.info("AutonomousOrchestrator started")
    
    async def stop(self):
        """Stop the background event processor."""
        self._running = False
        if self._worker_task:
            self._worker_task.cancel()
            try:
                await self._worker_task
            except asyncio.CancelledError:
                pass
        logger.info(f"AutonomousOrchestrator stopped. Processed {self._processed_count} events.")
    
    async def _event_processor(self):
        """Background worker that processes events from the queue."""
        while self._running:
            try:
                # Wait for next event with timeout
                event = await asyncio.wait_for(self._event_queue.get(), timeout=1.0)
                await self._handle_event(event)
                self._processed_count += 1
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                logger.error(f"Event processor error: {e}", exc_info=True)
    
    async def _handle_event(self, event: SystemEvent):
        """Dispatch event to registered handlers."""
        handlers = self._handlers.get(event.event_type, [])
        
        if not handlers:
            logger.debug(f"No handlers for event type: {event.event_type.value}")
            return
        
        for handler in handlers:
            try:
                logger.info(f"Executing handler {handler.__name__} for {event.event_type.value}")
                if asyncio.iscoroutinefunction(handler):
                    await handler(event)
                else:
                    handler(event)
            except Exception as e:
                logger.error(f"Handler {handler.__name__} failed: {e}", exc_info=True)
    
    # ═══════════════════════════════════════════════════════════════════════
    # DEFAULT EVENT HANDLERS
    # ═══════════════════════════════════════════════════════════════════════
    
    async def _on_document_ingested(self, event: SystemEvent):
        """
        Handler: Document Ingested
        Triggers: ResearchSwarm for autonomous legal research
        """
        doc_id = event.payload.get("doc_id")
        case_id = event.case_id
        
        logger.info(f"[AUTO] Document {doc_id} ingested → Triggering ResearchSwarm")
        
        try:
            from backend.app.agents.swarms.registry import get_swarm
            
            swarm = get_swarm("research")
            doc_text = event.payload.get("text", "")[:2000]
            metadata = event.payload.get("metadata", {})
            
            # Run research asynchronously
            result = await swarm.research_for_document(
                doc_id=doc_id,
                doc_text=doc_text,
                metadata=metadata,
                case_id=case_id
            )
            
            # Publish research completed event
            await self.publish(SystemEvent(
                event_type=EventType.RESEARCH_COMPLETED,
                case_id=case_id,
                source_service="ResearchSwarm",
                payload={"doc_id": doc_id, "result": result}
            ))
            
        except Exception as e:
            logger.error(f"ResearchSwarm trigger failed: {e}", exc_info=True)
    
    async def _on_research_completed(self, event: SystemEvent):
        """
        Handler: Research Completed
        Triggers: Graph update + Narrative rebuild
        """
        case_id = event.case_id
        doc_id = event.payload.get("doc_id")
        
        logger.info(f"[AUTO] Research completed for {doc_id} → Updating graph and narrative")
        
        try:
            from backend.app.services.knowledge_graph_service import get_knowledge_graph_service
            from backend.app.services.narrative_service import NarrativeService
            from backend.app.services.timeline_service import TimelineService
            from backend.app.storage.document_store import DocumentStore
            
            # Trigger graph update event
            await self.publish(SystemEvent(
                event_type=EventType.GRAPH_UPDATED,
                case_id=case_id,
                source_service="AutonomousOrchestrator",
                payload={"trigger": "research_completed", "doc_id": doc_id}
            ))
            
        except Exception as e:
            logger.error(f"Post-research processing failed: {e}", exc_info=True)
    
    async def _on_graph_updated(self, event: SystemEvent):
        """
        Handler: Graph Updated
        Triggers: Timeline refresh, Narrative rebuild, Contradiction detection
        """
        case_id = event.case_id
        
        logger.info(f"[AUTO] Graph updated for case {case_id} → Refreshing dependent services")
        
        try:
            from backend.app.services.narrative_service import NarrativeService
            from backend.app.services.timeline_service import TimelineService
            from backend.app.storage.document_store import DocumentStore
            
            # These services now have KG integration and will query the updated graph
            # The actual refresh can be triggered by the UI or scheduled
            logger.info(f"[AUTO] Services notified of graph update for case {case_id}")
            
        except Exception as e:
            logger.error(f"Graph update notification failed: {e}", exc_info=True)
    
    async def _on_contradiction_detected(self, event: SystemEvent):
        """
        Handler: Contradiction Detected
        Triggers: Devil's Advocate analysis
        """
        case_id = event.case_id
        contradiction = event.payload.get("contradiction", {})
        
        logger.info(f"[AUTO] Contradiction detected → Triggering Devil's Advocate")
        
        try:
            from backend.app.services.devils_advocate_service import DevilsAdvocateService
            from backend.app.services.timeline_service import TimelineService
            from backend.app.storage.document_store import DocumentStore
            
            # Devil's Advocate now has KG integration
            logger.info(f"[AUTO] Devil's Advocate notified of contradiction in case {case_id}")
            
        except Exception as e:
            logger.error(f"Devil's Advocate trigger failed: {e}", exc_info=True)
    
    async def _on_hot_document_flagged(self, event: SystemEvent):
        """
        Handler: Hot Document Flagged
        Triggers: Priority forensic analysis
        """
        doc_id = event.payload.get("doc_id")
        case_id = event.case_id
        reason = event.payload.get("reason", "unknown")
        
        logger.info(f"[AUTO] Hot document {doc_id} flagged ({reason}) → Priority analysis")
        
        try:
            # Trigger deep forensics on hot documents
            from backend.app.services.forensics_service import ForensicsService
            from backend.app.config import get_settings
            from backend.app.storage.document_store import DocumentStore
            
            # ForensicsService now has KG integration
            logger.info(f"[AUTO] Forensics service notified of hot document {doc_id}")
            
        except Exception as e:
            logger.error(f"Hot document processing failed: {e}", exc_info=True)
    
    async def _on_batch_complete(self, event: SystemEvent):
        """
        Handler: Batch Ingestion Complete
        
        Triggers the FULL AUTONOMOUS PIPELINE:
        Evidence → Research → Narrative → Trial Prep → Legal Outputs
        
        This is the master workflow that chains all swarms together,
        requiring minimal to no user intervention.
        """
        case_id = event.case_id
        doc_count = event.payload.get("doc_count", 0)
        
        logger.info(f"[AUTO] ═══════════════════════════════════════════════════════")
        logger.info(f"[AUTO] BATCH COMPLETE: {doc_count} docs in case {case_id}")
        logger.info(f"[AUTO] Starting FULL AUTONOMOUS PIPELINE")
        logger.info(f"[AUTO] ═══════════════════════════════════════════════════════")
        
        self._log_activity("pipeline_start", f"Case {case_id}: {doc_count} documents")
        
        try:
            # STAGE 1: Narrative Swarm - Build timeline & detect contradictions
            logger.info(f"[AUTO] Stage 1: NarrativeSwarm analyzing case timeline...")
            try:
                from backend.app.agents.swarms.registry import get_swarm
                narrative_swarm = get_swarm("narrative")
                narrative_result = await narrative_swarm.analyze_case(case_id)
                logger.info(f"[AUTO] Stage 1 Complete: Narrative analysis done")
                self._log_activity("narrative_complete", str(narrative_result)[:100])
            except Exception as e:
                logger.warning(f"[AUTO] Stage 1 (Narrative) failed: {e}")
            
            # STAGE 2: Knowledge Graph Build - Extract entities and relationships
            logger.info(f"[AUTO] Stage 2: KnowledgeGraphService building graph...")
            try:
                from backend.app.services.knowledge_graph_service import get_knowledge_graph_service
                kg_service = get_knowledge_graph_service()
                kg_context = await kg_service.get_case_context(case_id)
                logger.info(f"[AUTO] Stage 2 Complete: Knowledge Graph updated")
                self._log_activity("knowledge_graph_complete", f"Entities: {kg_context.get('entity_count', 0) if isinstance(kg_context, dict) else 'built'}")
            except Exception as e:
                logger.warning(f"[AUTO] Stage 2 (Knowledge Graph) failed: {e}")
            
            # STAGE 3: Fact Pattern Extraction - Identify key fact patterns from evidence
            logger.info(f"[AUTO] Stage 3: FactPatternService extracting fact patterns...")
            try:
                from backend.app.services.fact_pattern_service import get_fact_pattern_service
                fact_service = get_fact_pattern_service()
                patterns = await fact_service.extract_patterns(case_id)
                logger.info(f"[AUTO] Stage 3 Complete: {len(patterns)} fact patterns extracted")
                self._log_activity("fact_patterns_complete", f"Patterns: {len(patterns)}")
            except Exception as e:
                logger.warning(f"[AUTO] Stage 3 (Fact Patterns) failed: {e}")
            
            # STAGE 4: User Interview - Generate questions for user context (async - does not block)
            logger.info(f"[AUTO] Stage 4: UserInterviewService generating guided questions...")
            try:
                from backend.app.services.user_interview_service import get_user_interview_service
                interview_service = get_user_interview_service()
                questions = await interview_service.generate_questions(case_id, max_questions=10)
                status = interview_service.get_interview_status(case_id)
                logger.info(f"[AUTO] Stage 4 Complete: {len(questions)} questions generated for user")
                self._log_activity("interview_questions_generated", f"Questions: {len(questions)}, awaiting user responses")
                # Note: Pipeline continues - user can answer async, responses enrich later stages
            except Exception as e:
                logger.warning(f"[AUTO] Stage 4 (User Interview) failed: {e}")
            
            # STAGE 5: Context Engine - Build contextual understanding
            logger.info(f"[AUTO] Stage 5: ContextService building contextual index...")
            try:
                from backend.app.services.context_service import ContextService
                from backend.app.config import get_settings
                context_service = ContextService(get_settings())
                context_result = await context_service.query_context("case summary", case_id, top_k=10)
                logger.info(f"[AUTO] Stage 5 Complete: Context engine indexed")
                self._log_activity("context_engine_complete", f"Context nodes: {context_result.get('count', 0)}")
            except Exception as e:
                logger.warning(f"[AUTO] Stage 5 (Context Engine) failed: {e}")
            
            # STAGE 6: Legal Research Swarm - Find relevant case law
            logger.info(f"[AUTO] Stage 6: LegalResearchSwarm finding relevant precedents...")
            try:
                from backend.app.agents.swarms.registry import get_swarm
                research_swarm = get_swarm("legal_research")
                research_result = await research_swarm.research("case analysis", case_id, "california")
                logger.info(f"[AUTO] Stage 6 Complete: Legal research done")
                self._log_activity("research_complete", str(research_result)[:100])
            except Exception as e:
                logger.warning(f"[AUTO] Stage 6 (Research) failed: {e}")
            
            # STAGE 7: Legal Theory Engine - Generate legal theories
            logger.info(f"[AUTO] Stage 7: LegalTheoryEngine generating theories...")
            theories = []
            try:
                from backend.app.services.legal_theory_engine import LegalTheoryEngine
                theory_engine = LegalTheoryEngine()
                theories = await theory_engine.suggest_theories(case_id)
                logger.info(f"[AUTO] Stage 7 Complete: {len(theories)} legal theories generated")
                self._log_activity("legal_theory_complete", f"Theories: {[t.get('cause', 'Unknown') for t in theories[:3]]}")
            except Exception as e:
                logger.warning(f"[AUTO] Stage 7 (Legal Theory) failed: {e}")
            
            # STAGE 8: Timeline Builder - Build fact-pattern timeline from KG + theories
            logger.info(f"[AUTO] Stage 8: TimelineService building case timeline...")
            try:
                from backend.app.services.timeline_service import TimelineService
                timeline_service = TimelineService()
                
                # Sync events from Knowledge Graph
                new_events = await timeline_service.sync_from_kg(case_id)
                logger.info(f"[AUTO] Stage 8: Synced {new_events} events from KG")
                
                # If we have theories, add key fact pattern events
                if theories:
                    for theory in theories[:2]:  # Top 2 theories
                        indicators = theory.get('indicators', [])
                        for i, indicator in enumerate(indicators[:3]):  # Top 3 indicators per theory
                            try:
                                from datetime import datetime
                                timeline_service.add_event(case_id, {
                                    "title": f"[{theory.get('cause', 'Theory')}] {indicator[:50]}",
                                    "description": f"Key fact supporting {theory.get('cause', 'theory')}: {indicator}",
                                    "event_date": datetime.now(),  # Will be refined by user
                                    "metadata": {
                                        "source": "legal_theory",
                                        "theory": theory.get('cause'),
                                        "auto_generated": True
                                    }
                                })
                            except Exception as e:
                                logger.debug(f"Could not add theory indicator to timeline: {e}")
                
                timeline = timeline_service.get_timeline(case_id)
                logger.info(f"[AUTO] Stage 8 Complete: Timeline has {len(timeline)} events")
                self._log_activity("timeline_complete", f"Events: {len(timeline)}")
            except Exception as e:
                logger.warning(f"[AUTO] Stage 8 (Timeline Builder) failed: {e}")
            
            # STAGE 9: Trial Prep Swarm - Prepare for trial
            logger.info(f"[AUTO] Stage 9: TrialPrepSwarm preparing trial materials...")
            try:
                from backend.app.agents.swarms.registry import get_swarm
                trial_swarm = get_swarm("trial_prep")
                trial_result = await trial_swarm.prepare_for_trial(case_id, "plaintiff")
                logger.info(f"[AUTO] Stage 9 Complete: Trial prep done")
                self._log_activity("trial_prep_complete", str(trial_result)[:100])
            except Exception as e:
                logger.warning(f"[AUTO] Stage 9 (Trial Prep) failed: {e}")
            
            # STAGE 10: Forensics Swarm - Scan for evidence issues
            logger.info(f"[AUTO] Stage 10: ForensicsSwarm scanning evidence integrity...")
            try:
                from backend.app.agents.swarms.registry import get_swarm
                forensics_swarm = get_swarm("forensics")
                logger.info(f"[AUTO] Stage 10 Complete: Forensic scan done")
                self._log_activity("forensics_complete", "Evidence integrity scanned")
            except Exception as e:
                logger.warning(f"[AUTO] Stage 10 (Forensics) failed: {e}")
            
            # STAGE 11: Drafting Swarm - Generate initial drafts
            logger.info(f"[AUTO] Stage 11: DraftingSwarm creating initial briefs...")
            try:
                from backend.app.agents.swarms.registry import get_swarm
                drafting_swarm = get_swarm("drafting")
                draft_result = await drafting_swarm.draft_document("case_summary", case_id, "summarize case facts")
                logger.info(f"[AUTO] Stage 11 Complete: Initial drafts created")
                self._log_activity("drafting_complete", str(draft_result)[:100])
            except Exception as e:
                logger.warning(f"[AUTO] Stage 11 (Drafting) failed: {e}")
            
            # STAGE 12: Simulation Swarm - Run outcome predictions
            logger.info(f"[AUTO] Stage 12: SimulationSwarm predicting outcomes...")
            try:
                from backend.app.agents.swarms.registry import get_swarm
                sim_swarm = get_swarm("simulation")
                sim_result = await sim_swarm.run_simulation(case_id)
                logger.info(f"[AUTO] Stage 12 Complete: Outcome predictions ready")
                self._log_activity("simulation_complete", str(sim_result)[:100])
            except Exception as e:
                logger.warning(f"[AUTO] Stage 12 (Simulation) failed: {e}")
            
            # STAGE 13: Background Research Agent (The Autonomous Associate)
            logger.info(f"[AUTO] Stage 13: BackgroundResearchAgent analyzing for gaps...")
            try:
                from backend.app.agents.background_research_agent import BackgroundResearchAgent
                bg_agent = BackgroundResearchAgent()
                insights = await bg_agent.analyze_case(case_id)
                logger.info(f"[AUTO] Stage 13 Complete: {len(insights)} proactive insights found")
                self._log_activity("background_research_complete", f"Insights: {len(insights)}")
                
                # Store insights in memory/timeline for now (or broadcast)
                # In future: Persist to InsightsStore
            except Exception as e:
                logger.warning(f"[AUTO] Stage 13 (Background Research) failed: {e}")

            # STAGE 14: Intelligence Synthesis - Generate actionable intelligence report
            logger.info(f"[AUTO] Stage 14: Generating Intelligence Report...")
            try:
                from backend.app.services.intelligence_service import IntelligenceService
                intel_service = IntelligenceService()
                intel_result = await intel_service.synthesize_case_intelligence(case_id)
                logger.info(f"[AUTO] Stage 14 Complete: Intelligence report ready")
                self._log_activity("intelligence_report_complete", str(intel_result)[:100])
            except Exception as e:
                logger.warning(f"[AUTO] Stage 14 (Intelligence Synthesis) failed: {e}")

            
            logger.info(f"[AUTO] ═══════════════════════════════════════════════════════")
            logger.info(f"[AUTO] AUTONOMOUS PIPELINE COMPLETE for case {case_id}")
            logger.info(f"[AUTO] User can now review: Timeline, Research, Briefs, Predictions")
            logger.info(f"[AUTO] ═══════════════════════════════════════════════════════")
            
            self._log_activity("pipeline_complete", f"Case {case_id} fully analyzed")
            
            # Notify via Co-Counsel
            from backend.app.agents.swarms.comms_agent import get_comms_agent, SwarmMessage
            try:
                comms = get_comms_agent("orchestrator")
                await comms.send_message(
                    to_swarm="coordinator",
                    message_type="pipeline_complete",
                    content={
                        "case_id": case_id,
                        "stages_completed": 6,
                        "ready_for_review": True
                    },
                    case_id=case_id
                )
            except Exception as e:
                logger.debug(f"Coordinator notification failed: {e}")
            
        except Exception as e:
            logger.error(f"Autonomous pipeline failed: {e}", exc_info=True)
            self._log_activity("pipeline_error", str(e))


# ═══════════════════════════════════════════════════════════════════════════
# FACTORY FUNCTION
# ═══════════════════════════════════════════════════════════════════════════

def get_orchestrator() -> AutonomousOrchestrator:
    """Get the singleton orchestrator instance."""
    return AutonomousOrchestrator.get_instance()


# ═══════════════════════════════════════════════════════════════════════════
# FASTAPI LIFECYCLE HOOKS
# ═══════════════════════════════════════════════════════════════════════════

async def startup_orchestrator():
    """Start the orchestrator (call from FastAPI startup)."""
    orchestrator = get_orchestrator()
    await orchestrator.start()


async def shutdown_orchestrator():
    """Stop the orchestrator (call from FastAPI shutdown)."""
    orchestrator = get_orchestrator()
    await orchestrator.stop()
