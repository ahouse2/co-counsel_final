from __future__ import annotations

from typing import Iterable, List, Sequence

from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels

from ..config import get_settings


class VectorService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.client = self._create_client()
        self.ensure_collection()

    def _create_client(self) -> QdrantClient:
        if self.settings.qdrant_url:
            return QdrantClient(url=self.settings.qdrant_url)
        if self.settings.qdrant_path:
            return QdrantClient(path=self.settings.qdrant_path)
        return QdrantClient(path=str(self.settings.vector_dir))

    def ensure_collection(self) -> None:
        collection = self.settings.qdrant_collection
        size = self.settings.qdrant_vector_size
        try:
            info = self.client.get_collection(collection)
            if info.config.params.vectors.size == size:
                return
            self.client.delete_collection(collection)
        except Exception:
            pass
        try:
            self.client.delete_collection(collection_name=collection)
        except Exception:
            pass
        self.client.create_collection(
            collection_name=collection,
            vectors_config=qmodels.VectorParams(
                size=size,
                distance=qmodels.Distance(self.settings.qdrant_distance),
            ),
        )

    def upsert(
        self,
        points: Iterable[qmodels.PointStruct],
    ) -> None:
        self.client.upsert(collection_name=self.settings.qdrant_collection, points=list(points))

    def search(
        self,
        vector: Sequence[float],
        top_k: int = 8,
    ) -> List[qmodels.ScoredPoint]:
        return self.client.search(
            collection_name=self.settings.qdrant_collection,
            query_vector=list(vector),
            limit=top_k,
            with_payload=True,
        )


_vector_service: VectorService | None = None


def get_vector_service() -> VectorService:
    global _vector_service
    if _vector_service is None:
        _vector_service = VectorService()
    return _vector_service


def reset_vector_service() -> None:
    global _vector_service
    _vector_service = None

