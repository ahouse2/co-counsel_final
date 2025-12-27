"""
Orchestrator API - Exposes autonomous pipeline status and activity to frontend.
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime, timezone
import logging

from backend.app.services.autonomous_orchestrator import (
    get_orchestrator, 
    AutonomousOrchestrator,
    EventType,
    SystemEvent
)

logger = logging.getLogger(__name__)

router = APIRouter()


# ═══════════════════════════════════════════════════════════════════════════
# RESPONSE MODELS
# ═══════════════════════════════════════════════════════════════════════════

class ActivityLogEntry(BaseModel):
    timestamp: str
    type: str
    details: str


class PipelineStatus(BaseModel):
    is_running: bool
    current_stage: Optional[str] = None
    stages: List[Dict[str, Any]]
    processed_events: int
    pending_events: int


class TriggerRequest(BaseModel):
    case_id: str
    stage: Optional[str] = None  # If None, runs full pipeline


class SwarmStatus(BaseModel):
    name: str
    status: str
    last_activity: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════
# ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/activity", response_model=List[ActivityLogEntry])
async def get_activity_log():
    """Get recent orchestrator activity for dashboard display."""
    orchestrator = get_orchestrator()
    activities = orchestrator.get_activity_log()
    
    return [
        ActivityLogEntry(
            timestamp=a.get("timestamp", ""),
            type=a.get("type", "unknown"),
            details=a.get("details", "")
        )
        for a in activities
    ]


@router.get("/messages")
async def get_message_log():
    """Get cross-swarm message log for observability."""
    orchestrator = get_orchestrator()
    return orchestrator.get_message_log()


@router.get("/status", response_model=PipelineStatus)
async def get_pipeline_status():
    """Get current autonomous pipeline status."""
    orchestrator = get_orchestrator()
    
    stages = [
        {"name": "Narrative", "stage": 1, "status": "idle"},
        {"name": "Knowledge Graph", "stage": 2, "status": "idle"},
        {"name": "Fact Patterns", "stage": 3, "status": "idle"},
        {"name": "User Interview", "stage": 4, "status": "idle"},
        {"name": "Context Engine", "stage": 5, "status": "idle"},
        {"name": "Research", "stage": 6, "status": "idle"},
        {"name": "Legal Theory", "stage": 7, "status": "idle"},
        {"name": "Timeline", "stage": 8, "status": "idle"},
        {"name": "Trial Prep", "stage": 9, "status": "idle"},
        {"name": "Forensics", "stage": 10, "status": "idle"},
        {"name": "Drafting", "stage": 11, "status": "idle"},
        {"name": "Simulation", "stage": 12, "status": "idle"},
        {"name": "Intelligence", "stage": 13, "status": "idle"},
    ]
    
    # Check activity log for recent stage completions
    activities = orchestrator.get_activity_log()
    for activity in activities:
        activity_type = activity.get("type", "")
        if "narrative_complete" in activity_type:
            stages[0]["status"] = "complete"
        elif "knowledge_graph_complete" in activity_type:
            stages[1]["status"] = "complete"
        elif "fact_patterns_complete" in activity_type:
            stages[2]["status"] = "complete"
        elif "interview_questions_generated" in activity_type:
            stages[3]["status"] = "complete"
        elif "context_engine_complete" in activity_type:
            stages[4]["status"] = "complete"
        elif "research_complete" in activity_type:
            stages[5]["status"] = "complete"
        elif "legal_theory_complete" in activity_type:
            stages[6]["status"] = "complete"
        elif "timeline_complete" in activity_type:
            stages[7]["status"] = "complete"
        elif "trial_prep_complete" in activity_type:
            stages[8]["status"] = "complete"
        elif "forensics_complete" in activity_type:
            stages[9]["status"] = "complete"
        elif "drafting_complete" in activity_type:
            stages[10]["status"] = "complete"
        elif "simulation_complete" in activity_type:
            stages[11]["status"] = "complete"
        elif "intelligence_report_complete" in activity_type:
            stages[12]["status"] = "complete"
        elif "pipeline_start" in activity_type:
            # Find currently running stage
            for s in stages:
                if s["status"] == "idle":
                    s["status"] = "running"
                    break
    
    return PipelineStatus(
        is_running=orchestrator._running,
        current_stage=None,
        stages=stages,
        processed_events=orchestrator._processed_count,
        pending_events=orchestrator._event_queue.qsize() if orchestrator._event_queue else 0
    )


@router.post("/trigger")
async def trigger_pipeline(request: TriggerRequest, background_tasks: BackgroundTasks):
    """Manually trigger the autonomous pipeline for a case."""
    orchestrator = get_orchestrator()
    
    logger.info(f"Manual pipeline trigger for case {request.case_id}")
    
    # Create and publish batch complete event to trigger full pipeline
    event = SystemEvent(
        event_type=EventType.BATCH_INGESTION_COMPLETE,
        case_id=request.case_id,
        source_service="ManualTrigger",
        payload={"manual": True, "doc_count": 0, "requested_stage": request.stage}
    )
    
    # Ensure orchestrator is running
    if not orchestrator._running:
        background_tasks.add_task(orchestrator.start)
    
    # Publish the event
    await orchestrator.publish(event)
    
    return {
        "message": f"Pipeline triggered for case {request.case_id}",
        "event_id": event.event_id
    }


@router.get("/swarms")
async def get_swarm_status():
    """Get status of all registered swarms."""
    swarms = [
        {"name": "Ingestion", "status": "active", "icon": "📥"},
        {"name": "Research", "status": "active", "icon": "🔍"},
        {"name": "Narrative", "status": "active", "icon": "📖"},
        {"name": "Trial Prep", "status": "active", "icon": "⚖️"},
        {"name": "Forensics", "status": "active", "icon": "🔬"},
        {"name": "Drafting", "status": "active", "icon": "✍️"},
        {"name": "Simulation", "status": "active", "icon": "🎭"},
        {"name": "Legal Research", "status": "active", "icon": "📚"},
        {"name": "Asset Hunter", "status": "active", "icon": "💰"},
        {"name": "Context Engine", "status": "active", "icon": "🧠"},
    ]
    return swarms


@router.post("/start")
async def start_orchestrator():
    """Start the orchestrator event processor."""
    orchestrator = get_orchestrator()
    await orchestrator.start()
    return {"message": "Orchestrator started", "running": orchestrator._running}


@router.post("/stop")
async def stop_orchestrator():
    """Stop the orchestrator event processor."""
    orchestrator = get_orchestrator()
    await orchestrator.stop()
    return {"message": "Orchestrator stopped", "running": orchestrator._running}
