from __future__ import annotations
import os

from fastapi import FastAPI, Request, HTTPException

from .config import get_settings
from .telemetry import setup_telemetry
from .events import register_events

# Routers (imports are grouped to minimize top-level imports)
from .api import retrieval
from .api import graph
from .api import agents
from .api import scenarios
from .api import auth
from .api import evidence_binder
from .api import predictive_analytics
from .api import settings as settings_api
from .api import graphql
from .api import health
from .api import billing
from .api import onboarding
from .api import legal_research
from .api import legal_theory
from .api import argument_mapping
from .api import strategic_recommendations
from .api import timeline
from .api import voice
from .api import ingestion
from .api import knowledge
from .api import dev_agent
from .api import sandbox
from .api import cost
from .api import documents
from .api import document_drafting
from .api import binder_preparation
from .api import feedback
from .api import mock_trial
from .api import forensics
from .api import knowledge_graph
from .api import service_of_process
from .api import users
from .api import cases
from .api import trial_university
from .api import halo

settings = get_settings()
setup_telemetry(settings)
app = FastAPI(title=settings.app_name, version=settings.app_version)

# [dev] mTLS enabled
import ssl


@ app.middleware("http")
async def mtls_middleware(request: Request, call_next):
    if request.url.scheme == "https" and "ssl_client_cert" not in request.scope:
        raise HTTPException(status_code=403, detail="Client certificate required")
    response = await call_next(request)
    return response

# Include routers (order generally fine for tests)
app.include_router(retrieval.router)
app.include_router(graph.router)
app.include_router(agents.router, prefix="/agents", tags=["Agents"])
app.include_router(scenarios.router)
app.include_router(auth.router)
app.include_router(evidence_binder.router)
app.include_router(predictive_analytics.router)
app.include_router(settings_api.router, prefix="/api", tags=["Settings"])
app.include_router(graphql.router)
app.include_router(health.router)
register_events(app)
app.include_router(billing.router)
app.include_router(onboarding.router)
app.include_router(legal_research.router)
app.include_router(legal_theory.router)
app.include_router(argument_mapping.router)
app.include_router(strategic_recommendations.router)
app.include_router(timeline.router)
app.include_router(voice.router)
app.include_router(ingestion.router)
app.include_router(knowledge.router)
app.include_router(dev_agent.router)
app.include_router(sandbox.router)
app.include_router(cost.router)
app.include_router(documents.router)
app.include_router(document_drafting.router)
app.include_router(binder_preparation.router)
app.include_router(feedback.router)
app.include_router(mock_trial.router)
app.include_router(forensics.router, prefix="/forensics", tags=["Forensics"])
app.include_router(knowledge_graph.router, prefix="/knowledge-graph", tags=["Knowledge Graph"])
app.include_router(service_of_process.router, prefix="/api", tags=["Service of Process"])
app.include_router(users.router, prefix="/api", tags=["Users"])
app.include_router(cases.router, prefix="/api", tags=["Cases"])
app.include_router(trial_university.router)
# Halo bootstrap (new)
app.include_router(halo.router, prefix="/api", tags=["Halo"])

# DB initialization
from .database import engine, Base
from .models import service_of_process, document, recipient, user, role, user_role, permission, role_permission
Base.metadata.create_all(bind=engine)
