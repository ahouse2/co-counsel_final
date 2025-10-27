from __future__ import annotations

import csv
import io
import json
import math
from collections import defaultdict
from datetime import datetime, timezone
from hashlib import md5, sha256
from pathlib import Path
from statistics import mean, pstdev
from typing import Dict, List, Tuple

from PIL import Image, ImageChops

from ..config import get_settings
from ..utils.text import read_text
class ForensicsService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.base_dir = self.settings.forensics_dir
        self.base_dir.mkdir(parents=True, exist_ok=True)

    # region Document
    def build_document_artifact(self, file_id: str, path: Path) -> Dict[str, object]:
        content = read_text(path)
        lines = content.splitlines()
        words = content.split()
        payload = {
            "hashes": {
                "md5": md5(content.encode("utf-8")).hexdigest(),
                "sha256": sha256(content.encode("utf-8")).hexdigest(),
            },
            "metadata": {
                "path": str(path.resolve()),
                "size_bytes": path.stat().st_size,
                "line_count": len(lines),
                "word_count": len(words),
                "generated_at": datetime.now(timezone.utc).isoformat(),
            },
            "structure": {
                "preview": lines[:5],
                "avg_line_length": mean(len(line) for line in lines) if lines else 0.0,
            },
            "authenticity": {
                "integrity": "verified" if path.exists() else "missing",
                "entropy": self._shannon_entropy(content),
            },
        }
        self._write_artifact(file_id, "document", payload)
        return payload

    # endregion

    # region Image
    def build_image_artifact(self, file_id: str, path: Path) -> Dict[str, object]:
        with Image.open(path) as img:
            exif = getattr(img, "_getexif", lambda: None)()
            ela_score = self._ela_score(img)
            clone_blocks = self._clone_blocks(img)
            payload = {
                "metadata": {
                    "size": img.size,
                    "mode": img.mode,
                    "format": img.format,
                    "exif": exif or {},
                },
                "ela": {
                    "mean_absolute_diff": ela_score,
                },
                "clones": clone_blocks,
                "authenticity_score": max(0.0, 1.0 - ela_score / 50.0),
            }
        self._write_artifact(file_id, "image", payload)
        return payload

    # endregion

    # region Financial
    def build_financial_artifact(self, file_id: str, path: Path) -> Dict[str, object]:
        rows, headers = self._load_tabular(path)
        totals = self._column_totals(rows, headers)
        anomalies = self._zscore_anomalies(rows, headers)
        payload = {
            "totals": totals,
            "anomalies": anomalies,
            "entities": list({row.get("entity") for row in rows if row.get("entity")}),
            "summary": f"Processed {len(rows)} rows with {len(headers)} columns",
        }
        self._write_artifact(file_id, "financial", payload)
        return payload

    # endregion

    # region Retrieval
    def load_artifact(self, file_id: str, artifact: str) -> Dict[str, object]:
        target = self.base_dir / file_id / f"{artifact}.json"
        if not target.exists():
            raise FileNotFoundError(f"Artifact {artifact} missing for {file_id}")
        return json.loads(target.read_text())

    # endregion

    # region Helpers
    def _write_artifact(self, file_id: str, name: str, payload: Dict[str, object]) -> None:
        directory = self.base_dir / file_id
        directory.mkdir(parents=True, exist_ok=True)
        (directory / f"{name}.json").write_text(json.dumps(payload, indent=2, sort_keys=True))

    def _shannon_entropy(self, text: str) -> float:
        if not text:
            return 0.0
        freq: Dict[str, int] = defaultdict(int)
        for char in text:
            freq[char] += 1
        total = len(text)
        entropy = 0.0
        for count in freq.values():
            p = count / total
            entropy -= p * math.log2(p)
        return entropy

    def _ela_score(self, image: Image.Image) -> float:
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG", quality=95)
        buffer.seek(0)
        recompressed = Image.open(buffer)
        diff = ImageChops.difference(image.convert("RGB"), recompressed.convert("RGB"))
        stat = diff.getdata()
        total = 0.0
        count = 0
        for pixel in stat:
            if isinstance(pixel, tuple):
                total += sum(abs(channel) for channel in pixel) / len(pixel)
            else:
                total += abs(pixel)
            count += 1
        return total / max(count, 1)

    def _clone_blocks(self, image: Image.Image, block: int = 8) -> List[Dict[str, object]]:
        width, height = image.size
        clones: List[Dict[str, object]] = []
        hashes: Dict[str, Tuple[int, int]] = {}
        rgb = image.convert("L")
        for y in range(0, height - block + 1, block):
            for x in range(0, width - block + 1, block):
                crop = rgb.crop((x, y, x + block, y + block))
                avg = int(mean(crop.getdata()))
                bits = ["1" if value > avg else "0" for value in crop.getdata()]
                signature = "".join(bits)
                if signature in hashes:
                    clones.append({"source": hashes[signature], "duplicate": (x, y)})
                else:
                    hashes[signature] = (x, y)
        return clones

    def _load_tabular(self, path: Path) -> Tuple[List[Dict[str, str]], List[str]]:
        with path.open("r", encoding="utf-8") as handle:
            reader = csv.DictReader(handle)
            rows = [dict(row) for row in reader]
        return rows, reader.fieldnames or []

    def _column_totals(self, rows: List[Dict[str, str]], headers: List[str]) -> Dict[str, float]:
        totals: Dict[str, float] = {}
        for header in headers:
            values: List[float] = []
            for row in rows:
                value = row.get(header)
                if value is None:
                    continue
                try:
                    values.append(float(value))
                except ValueError:
                    continue
            if values:
                totals[header] = sum(values)
        return totals

    def _zscore_anomalies(
        self, rows: List[Dict[str, str]], headers: List[str], threshold: float = 3.0
    ) -> List[Dict[str, object]]:
        anomalies: List[Dict[str, object]] = []
        for header in headers:
            values: List[float] = []
            for row in rows:
                value = row.get(header)
                if value is None:
                    continue
                try:
                    values.append(float(value))
                except ValueError:
                    continue
            if len(values) < 2:
                continue
            mu = mean(values)
            sigma = pstdev(values)
            if sigma == 0:
                continue
            for idx, value in enumerate(values):
                z = (value - mu) / sigma
                if abs(z) >= threshold:
                    anomalies.append({"row_index": idx, "column": header, "value": value, "zscore": z})
        return anomalies

    # endregion


def get_forensics_service() -> ForensicsService:
    return ForensicsService()

