"""
Summarizer Agent - Generates concise summaries of documents.
"""
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)


class SummarizerAgent:
    """
    Agent that generates intelligent summaries of documents,
    including key points, legal implications, and action items.
    """
    
    def __init__(self, llm_service):
        self.llm_service = llm_service
    
    async def generate_summary(self, text: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates a comprehensive summary of a document.
        
        Returns:
            Dict with: brief_summary, key_points, legal_implications, action_items
        """
        if not text or len(text) < 100:
            logger.warning("Text too short for summarization")
            return {"brief_summary": "Document too short to summarize", "key_points": [], "legal_implications": [], "action_items": []}
        
        prompt = f"""You are a legal document analyst. Provide a comprehensive summary of this document.

DOCUMENT TEXT (first 6000 chars):
{text[:6000]}

DOCUMENT INFO:
- File: {metadata.get('file_name', 'Unknown')}
- Type: {metadata.get('doc_type', 'Unknown')}

INSTRUCTIONS:
Generate a structured summary with the following sections:

1. BRIEF SUMMARY (2-3 sentences capturing the essence)
2. KEY POINTS (3-7 bullet points of important facts)
3. LEGAL IMPLICATIONS (potential legal significance)
4. ACTION ITEMS (recommended next steps for legal team)

OUTPUT FORMAT (JSON):
{{
  "brief_summary": "A concise 2-3 sentence summary...",
  "key_points": ["Point 1", "Point 2", "Point 3"],
  "legal_implications": ["Implication 1", "Implication 2"],
  "action_items": ["Action 1", "Action 2"],
  "document_type_detected": "contract|pleading|correspondence|evidence|other",
  "urgency": "low|medium|high"
}}

Generate summary now (JSON only):"""

        try:
            response = await self._complete_async(prompt)
            text_response = response.text if hasattr(response, 'text') else str(response)
            
            # Parse JSON
            import json
            if "```json" in text_response:
                text_response = text_response.split("```json")[1].split("```")[0]
            elif "```" in text_response:
                text_response = text_response.split("```")[1].split("```")[0]
            
            summary = json.loads(text_response.strip())
            
            if isinstance(summary, dict):
                logger.info(f"Generated summary: {len(summary.get('key_points', []))} key points")
                return summary
            
            return {"brief_summary": "Unable to parse summary", "key_points": [], "legal_implications": [], "action_items": []}
            
        except Exception as e:
            logger.error(f"Summary generation failed: {e}", exc_info=True)
            return {"brief_summary": f"Summary generation failed: {str(e)}", "key_points": [], "legal_implications": [], "action_items": []}
    
    async def _complete_async(self, prompt: str):
        """Wrapper to handle sync/async LLM calls"""
        import asyncio
        if hasattr(self.llm_service, 'acomplete'):
            return await self.llm_service.acomplete(prompt)
        else:
            return await asyncio.to_thread(self.llm_service.complete, prompt)
