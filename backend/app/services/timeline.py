from __future__ import annotations

from typing import List

from ..config import get_settings
from ..storage.timeline_store import TimelineStore, TimelineEvent


class TimelineService:
    def __init__(self, store: TimelineStore | None = None) -> None:
        self.settings = get_settings()
        self.store = store or TimelineStore(self.settings.timeline_path)

    def list_events(self) -> List[TimelineEvent]:
        return self.store.read_all()


def get_timeline_service() -> TimelineService:
    return TimelineService()

