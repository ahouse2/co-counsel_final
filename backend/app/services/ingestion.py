from __future__ import annotations

import mimetypes
from dataclasses import dataclass
from datetime import datetime
from hashlib import sha256
from pathlib import Path
from typing import Dict, List
from uuid import uuid4

from fastapi import HTTPException
from qdrant_client.http import models as qmodels

from ..config import get_settings
from ..models.api import IngestionRequest
from ..storage.document_store import DocumentStore
from ..storage.job_store import JobStore
from ..storage.timeline_store import TimelineEvent, TimelineStore
from ..utils.text import chunk_text, extract_capitalized_entities, find_dates, hashed_embedding, read_text
from .forensics import ForensicsService
from .graph import GraphService, get_graph_service
from .vector import VectorService, get_vector_service

_TEXT_EXTENSIONS = {".txt", ".md", ".json", ".log", ".rtf"}
_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".bmp"}
_FINANCIAL_EXTENSIONS = {".csv"}


@dataclass
class IngestedDocument:
    id: str
    uri: str
    type: str
    title: str

    def to_dict(self) -> Dict[str, object]:
        return {
            "id": self.id,
            "uri": self.uri,
            "type": self.type,
            "title": self.title,
        }


class IngestionService:
    def __init__(
        self,
        vector_service: VectorService | None = None,
        graph_service: GraphService | None = None,
        timeline_store: TimelineStore | None = None,
        job_store: JobStore | None = None,
        document_store: DocumentStore | None = None,
        forensics_service: ForensicsService | None = None,
    ) -> None:
        self.settings = get_settings()
        self.vector_service = vector_service or get_vector_service()
        self.graph_service = graph_service or get_graph_service()
        self.timeline_store = timeline_store or TimelineStore(self.settings.timeline_path)
        self.job_store = job_store or JobStore(self.settings.job_store_dir)
        self.document_store = document_store or DocumentStore(self.settings.document_store_dir)
        self.forensics_service = forensics_service or ForensicsService()

    def ingest(self, request: IngestionRequest) -> str:
        if not request.sources:
            raise HTTPException(status_code=400, detail="At least one source must be provided")
        job_id = str(uuid4())
        ingested: List[IngestedDocument] = []
        timeline_events: List[TimelineEvent] = []
        for source in request.sources:
            handler = source.type.lower()
            if handler == "local":
                if not source.path:
                    raise HTTPException(status_code=400, detail="Local source requires a path")
                ingested_docs, events = self._ingest_local(Path(source.path))
                ingested.extend(ingested_docs)
                timeline_events.extend(events)
            else:
                raise HTTPException(
                    status_code=422,
                    detail=f"Source type '{source.type}' is not supported in this deployment",
                )
        if timeline_events:
            self.timeline_store.append(timeline_events)
        self.job_store.write_job(
            job_id,
            {
                "status": "completed",
                "documents": [doc.to_dict() for doc in ingested],
            },
        )
        return job_id

    def _ingest_local(self, root: Path) -> tuple[List[IngestedDocument], List[TimelineEvent]]:
        if not root.exists():
            raise HTTPException(status_code=404, detail=f"Source path {root} not found")
        documents: List[IngestedDocument] = []
        events: List[TimelineEvent] = []
        for path in sorted(root.rglob("*")):
            if not path.is_file():
                continue
            suffix = path.suffix.lower()
            if suffix in _TEXT_EXTENSIONS:
                doc = self._ingest_text(path)
                documents.append(doc["document"])
                events.extend(doc["timeline"])
            elif suffix in _IMAGE_EXTENSIONS:
                doc_meta = self._register_document(path, doc_type="image")
                self.forensics_service.build_image_artifact(doc_meta.id, path)
                documents.append(doc_meta)
            elif suffix in _FINANCIAL_EXTENSIONS:
                doc_meta = self._register_document(path, doc_type="financial")
                self.forensics_service.build_financial_artifact(doc_meta.id, path)
                documents.append(doc_meta)
            else:
                # Skip unsupported formats quietly to keep ingestion resilient
                continue
        return documents, events

    def _ingest_text(self, path: Path) -> Dict[str, object]:
        document = self._register_document(path, doc_type="text")
        text = read_text(path)
        chunks = chunk_text(text, self.settings.ingestion_chunk_size, self.settings.ingestion_chunk_overlap)
        points: List[qmodels.PointStruct] = []
        for idx, chunk in enumerate(chunks):
            vector = hashed_embedding(chunk, self.settings.qdrant_vector_size)
            payload = {
                "doc_id": document.id,
                "chunk_index": idx,
                "text": chunk,
                "uri": document.uri,
                "source_path": document.uri,
            }
            points.append(
                qmodels.PointStruct(
                    id=str(uuid4()),
                    vector=vector,
                    payload=payload,
                )
            )
            self._index_entities(document.id, chunk)
        if points:
            self.vector_service.upsert(points)
        timeline_events = self._build_timeline_events(document.id, text)
        self.forensics_service.build_document_artifact(document.id, path)
        return {"document": document, "timeline": timeline_events}

    def _register_document(self, path: Path, doc_type: str) -> IngestedDocument:
        doc_id = sha256_id(path)
        title = path.stem.replace("_", " ").title()
        uri = str(path.resolve())
        mime_type, _ = mimetypes.guess_type(path.name)
        metadata = {"uri": uri, "type": doc_type, "name": path.name, "mime_type": mime_type}
        self.graph_service.upsert_document(doc_id, title, metadata)
        self.document_store.write_document(doc_id, {"id": doc_id, "title": title, **metadata})
        return IngestedDocument(id=doc_id, uri=uri, type=doc_type, title=title)

    def _index_entities(self, doc_id: str, text: str) -> None:
        labels = extract_capitalized_entities(text)
        for label in labels:
            entity_id = f"entity::{label}"
            self.graph_service.upsert_entity(entity_id, "Entity", {"label": label})
            self.graph_service.merge_relation(
                doc_id,
                "MENTIONS",
                entity_id,
                {"evidence": label},
            )

    def _build_timeline_events(self, doc_id: str, text: str) -> List[TimelineEvent]:
        events: List[TimelineEvent] = []
        for idx, ts_str in enumerate(find_dates(text)):
            timestamp = parse_timestamp(ts_str)
            if not timestamp:
                continue
            event = TimelineEvent(
                id=f"{doc_id}::event::{idx}",
                ts=timestamp,
                title=f"Event from {doc_id}",
                summary=f"Evidence mentions {ts_str}",
                citations=[doc_id],
            )
            events.append(event)
        return events


def sha256_id(path: Path) -> str:
    value = str(path.resolve()).encode("utf-8")
    return sha256(value).hexdigest()


def parse_timestamp(raw: str) -> datetime | None:
    try:
        if "-" in raw:
            return datetime.fromisoformat(raw)
        if "/" in raw:
            month, day, year = raw.split("/")
            return datetime(int(year), int(month), int(day))
    except ValueError:
        return None
    return None


def get_ingestion_service() -> IngestionService:
    return IngestionService()

