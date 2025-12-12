from typing import List, Dict, Any, Optional
import json
import logging
import re
from datetime import datetime
from dateutil import parser as dateparser

from backend.app.services.llm_service import LLMService

logger = logging.getLogger(__name__)


class TimelineAgent:
    """
    Autonomous agent specialized in extracting chronological events from legal documents.
    
    Features:
    - Robust multi-format date parsing
    - Confidence scoring for each event
    - Source passage linking
    - Event deduplication
    """
    
    # Common date patterns for regex-based extraction
    DATE_PATTERNS = [
        r'\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b',  # 01/15/2023, 1-15-23
        r'\b(\d{4}[/-]\d{1,2}[/-]\d{1,2})\b',      # 2023-01-15
        r'\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b',
        r'\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b',
    ]
    
    def __init__(self, llm_service: LLMService):
        self.llm_service = llm_service

    async def extract_events(self, text: str, metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Analyzes text and returns a list of timeline events with:
        - Parsed dates (robust multi-format support)
        - Confidence scores (0.0-1.0)
        - Source passage references
        """
        if not text or len(text) < 50:
            logger.warning("Text too short for timeline extraction")
            return []
        
        # Limit text length
        truncated_text = text[:50000]
        
        # Pre-extract dates to help LLM
        detected_dates = self._extract_dates_regex(truncated_text)
        date_hint = f"Detected dates in text: {detected_dates[:10]}" if detected_dates else ""
        
        prompt = f"""You are an expert legal analyst performing timeline extraction.

DOCUMENT INFO:
- File: {metadata.get('file_name', 'Unknown')}
- Type: {metadata.get('doc_type', 'Unknown')}
{date_hint}

INSTRUCTIONS:
1. Extract ALL factual events with dates/times from the document
2. For each event, provide:
   - title: Brief event name (max 10 words)
   - description: Detailed description (1-3 sentences)
   - date: Exact date in ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)
   - confidence: Your confidence in the date accuracy (0.0-1.0)
   - source_quote: The exact quote from the text that mentions this event (max 200 chars)
   - event_type: One of [fact, filing, testimony, evidence, correspondence, deadline]

3. If a date is approximate (e.g., "early 2023"), use your best guess and set confidence lower
4. Focus on factual events, not procedural ones

OUTPUT (JSON array only, no explanation):
[
  {{
    "title": "Contract Signed",
    "description": "John Doe signed employment contract with ABC Corp.",
    "date": "2023-01-15",
    "confidence": 0.95,
    "source_quote": "On January 15, 2023, the parties executed the employment agreement.",
    "event_type": "fact"
  }}
]

TEXT TO ANALYZE:
{truncated_text[:30000]}"""

        try:
            response = await self.llm_service.generate_text(prompt)
            events = self._parse_response(response)
            
            # Post-process: ensure all dates are properly parsed
            for event in events:
                event['date'] = self._parse_date(event.get('date', ''))
                event['confidence'] = float(event.get('confidence', 0.5))
                event['metadata'] = {'source': 'ai_extraction', 'agent': 'TimelineAgent'}
            
            logger.info(f"Extracted {len(events)} timeline events")
            return events
            
        except Exception as e:
            logger.error(f"Timeline extraction failed: {e}", exc_info=True)
            return []

    def _extract_dates_regex(self, text: str) -> List[str]:
        """Pre-extract dates using regex for LLM context"""
        dates = []
        for pattern in self.DATE_PATTERNS:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                if isinstance(match, tuple):
                    dates.append(' '.join(str(m) for m in match))
                else:
                    dates.append(str(match))
        return list(set(dates))[:20]  # Deduplicate and limit

    def _parse_date(self, date_str: str) -> str:
        """Robust date parsing with multiple format support"""
        if not date_str:
            return datetime.now().isoformat()
        
        try:
            # Use dateutil for flexible parsing
            parsed = dateparser.parse(date_str, fuzzy=True)
            if parsed:
                return parsed.isoformat()
        except Exception:
            pass
        
        # Fallback: try common formats manually
        formats = [
            "%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%m/%d/%Y", "%d/%m/%Y",
            "%B %d, %Y", "%d %B %Y", "%Y/%m/%d", "%m-%d-%Y"
        ]
        
        for fmt in formats:
            try:
                parsed = datetime.strptime(date_str, fmt)
                return parsed.isoformat()
            except ValueError:
                continue
        
        logger.warning(f"Could not parse date: {date_str}")
        return datetime.now().isoformat()

    def _parse_response(self, response: str) -> List[Dict[str, Any]]:
        """Parse LLM JSON response with error handling"""
        try:
            # Clean markdown
            if "```json" in response:
                response = response.split("```json")[1].split("```")[0]
            elif "```" in response:
                response = response.split("```")[1].split("```")[0]
            
            events = json.loads(response.strip())
            
            if not isinstance(events, list):
                return []
            
            # Validate required fields
            valid_events = []
            for event in events:
                if "title" in event and ("date" in event or "event_date" in event):
                    # Normalize field names
                    if "event_date" in event and "date" not in event:
                        event["date"] = event["event_date"]
                    valid_events.append(event)
            
            return valid_events
            
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse LLM response as JSON: {e}")
            return []

