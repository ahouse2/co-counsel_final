from __future__ import annotations

from __future__ import annotations

from decimal import Decimal
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import pandas as pd
import pytest
from PIL import Image

from backend.app import config
from backend.app.services.forensics import SCHEMA_VERSION, ForensicsService


@pytest.fixture()
def forensics_service(tmp_path, monkeypatch) -> ForensicsService:
    storage = tmp_path / "forensics"
    monkeypatch.setenv("FORENSICS_DIR", str(storage))
    config.reset_settings_cache()
    return ForensicsService()


def test_document_pipeline_stages(forensics_service: ForensicsService, tmp_path: Path) -> None:
    text_file = tmp_path / "brief.txt"
    text_file.write_text(
        "Table of Contents\n\nSECTION ONE\nAcme Corp entered into a settlement."
    )
    report = forensics_service.build_document_artifact("doc-1", text_file)
    assert report.schema_version == SCHEMA_VERSION
    assert [stage.name for stage in report.stages] == ["canonicalise", "metadata", "analyse"]
    assert report.data["hashes"]["sha256"]
    assert report.metadata["mime_type"].startswith("text/")
    assert report.summary
    stored = forensics_service.load_artifact("doc-1", "document")
    assert stored["schema_version"] == SCHEMA_VERSION


def test_image_low_resolution_fallback(forensics_service: ForensicsService, tmp_path: Path) -> None:
    image_path = tmp_path / "thumb.png"
    image = Image.new("RGB", (64, 64), color=(200, 100, 50))
    image.save(image_path)
    report = forensics_service.build_image_artifact("img-1", image_path)
    assert report.fallback_applied is True
    payload = forensics_service.load_artifact("img-1", "image")
    assert payload["fallback_applied"] is True
    assert payload["data"]["ela"]["mean_absolute_error"] >= 0.0


def test_financial_anomaly_detection(forensics_service: ForensicsService, tmp_path: Path) -> None:
    ledger = tmp_path / "ledger.csv"
    frame = pd.DataFrame(
        {
            "entity": ["Acme", "Acme", "Beta", "Beta", "Omega"],
            "amount": [100, 100, 400, 100, 5000],
            "balance": [100, 105, 110, 111, 9999],
        }
    )
    frame.to_csv(ledger, index=False)
    report = forensics_service.build_financial_artifact("fin-1", ledger)
    totals = report.data["totals"]
    assert Decimal(totals["amount"]) == Decimal("5700")
    assert report.data["anomalies"], "Expected anomalies to be flagged"
    stored = forensics_service.load_artifact("fin-1", "financial")
    assert stored["signals"]
