from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, HttpUrl


class IngestionSource(BaseModel):
    type: str = Field(description="Source type identifier")
    path: Optional[str] = Field(default=None, description="Filesystem path for local sources")
    credRef: Optional[str] = Field(default=None, description="Credential reference for remote sources")


class IngestionRequest(BaseModel):
    sources: List[IngestionSource]


class IngestionResponse(BaseModel):
    job_id: str = Field(description="Identifier tracking the ingestion operation")
    status: str = Field(description="Current job status")


class CitationModel(BaseModel):
    docId: str
    span: str
    uri: Optional[HttpUrl | str] = None


class TraceModel(BaseModel):
    vector: List[dict]
    graph: dict


class QueryResponse(BaseModel):
    answer: str
    citations: List[CitationModel]
    traces: TraceModel


class TimelineEventModel(BaseModel):
    id: str
    ts: datetime
    title: str
    summary: str
    citations: List[str]


class TimelineResponse(BaseModel):
    events: List[TimelineEventModel]


class GraphNodeModel(BaseModel):
    id: str
    type: str
    properties: dict


class GraphEdgeModel(BaseModel):
    source: str
    target: str
    type: str
    properties: dict


class GraphNeighborResponse(BaseModel):
    nodes: List[GraphNodeModel]
    edges: List[GraphEdgeModel]


class ForensicsResponse(BaseModel):
    data: dict

