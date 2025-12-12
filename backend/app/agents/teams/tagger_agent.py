"""
Tagger Agent - Automatically tags documents with relevant keywords and categories.
"""
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)


class TaggerAgent:
    """
    Agent that analyzes document content and generates relevant tags.
    Uses LLM to understand context and suggest appropriate tags.
    """
    
    def __init__(self, llm_service):
        self.llm_service = llm_service
    
    async def generate_tags(self, text: str, metadata: Dict[str, Any]) -> List[str]:
        """
        Generates tags for a document based on its content and metadata.
        
        Returns:
            List of tag strings
        """
        if not text or len(text) < 50:
            logger.warning("Text too short for tag generation")
            return []
        
        prompt = f"""You are a legal document tagging expert. Analyze the following document and generate relevant tags.

DOCUMENT TEXT (first 3000 chars):
{text[:3000]}

METADATA:
- File name: {metadata.get('file_name', 'Unknown')}
- Doc type: {metadata.get('doc_type', 'Unknown')}

INSTRUCTIONS:
1. Generate 5-15 relevant tags for this document
2. Tags should be lowercase, single words or short phrases
3. Include tags for: document type, legal area, parties involved, key topics, dates mentioned
4. Return ONLY a JSON array of strings, no explanation

Example output: ["contract", "employment", "non-compete", "2023", "termination clause"]

Generate tags now:"""

        try:
            response = await self._complete_async(prompt)
            text_response = response.text if hasattr(response, 'text') else str(response)
            
            # Parse JSON array from response
            import json
            # Clean up response
            if "```json" in text_response:
                text_response = text_response.split("```json")[1].split("```")[0]
            elif "```" in text_response:
                text_response = text_response.split("```")[1].split("```")[0]
            
            tags = json.loads(text_response.strip())
            
            if isinstance(tags, list):
                logger.info(f"Generated {len(tags)} tags")
                return [str(t).lower().strip() for t in tags[:15]]
            return []
            
        except Exception as e:
            logger.error(f"Tag generation failed: {e}", exc_info=True)
            return []
    
    async def _complete_async(self, prompt: str):
        """Wrapper to handle sync/async LLM calls"""
        import asyncio
        if hasattr(self.llm_service, 'acomplete'):
            return await self.llm_service.acomplete(prompt)
        else:
            return await asyncio.to_thread(self.llm_service.complete, prompt)
