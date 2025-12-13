import json
import os
from typing import List, Dict, Any
from backend.app.config import get_settings
from backend.ingestion.llama_index_factory import create_llm_service
from backend.ingestion.settings import build_runtime_config
from backend.app.services.timeline import get_timeline_service

class AssetAgent:
    """
    Advanced Forensic Agent for detecting hidden assets and obfuscation schemes.
    Uses a knowledge base of forensic accounting techniques (Trusts, Offshore, Shells).
    """

    def __init__(self):
        settings = get_settings()
        runtime_config = build_runtime_config(settings)
        self.llm_service = create_llm_service(runtime_config.llm)
        self.timeline_service = get_timeline_service()
        self.knowledge_base = self._load_knowledge_base()

    def _load_knowledge_base(self) -> List[Dict[str, Any]]:
        """Loads the asset schemes knowledge base."""
        try:
            # Assuming the file is in backend/app/knowledge/asset_schemes.json
            base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            kb_path = os.path.join(base_path, "knowledge", "asset_schemes.json")
            
            if os.path.exists(kb_path):
                with open(kb_path, "r") as f:
                    return json.load(f)
            return []
        except Exception as e:
            print(f"Error loading asset knowledge base: {e}")
            return []

    def scan_for_assets(self, case_id: str) -> Dict[str, Any]:
        """
        Scans case documents/timeline for hidden asset indicators using forensic knowledge.
        """
        # 1. Get Context (Timeline + recent docs)
        try:
            timeline_result = self.timeline_service.list_events(case_id)
            events = timeline_result.events if timeline_result else []
        except Exception:
            events = []
            
        # Filter for financial keywords
        financial_keywords = ["bank", "transfer", "trust", "llc", "offshore", "cayman", "panama", "crypto", "bitcoin", "wire", "asset", "purchase", "consulting", "loan", "gift", "management fee"]
        relevant_events = [
            e for e in events 
            if any(k in e.summary.lower() for k in financial_keywords)
        ]
        
        context_text = "\n".join([
            f"- {e.ts}: {e.summary}" for e in relevant_events[-50:]
        ])

        if not context_text:
            return {"assets": [], "risk_score": 0.0, "summary": "No financial indicators found in timeline."}

        # 2. Prepare Knowledge Base String
        kb_str = json.dumps(self.knowledge_base, indent=2)

        # 3. Prompt LLM
        prompt = f"""
        You are a Senior Forensic Accountant and Asset Tracing Expert.
        Your goal is to identify potential HIDDEN ASSETS, UNDISCLOSED INCOME, and OBFUSCATION SCHEMES in the provided case evidence.

        Use the following "Forensic Playbook" of known schemes to guide your analysis:
        {kb_str}

        Analyze the Evidence below. Look for:
        1. **Direct Matches**: Keywords like "Trust", "Cayman", "Offshore".
        2. **Indirect Indicators**: 
           - Lifestyle vs. Income discrepancies (e.g., high spending but low income).
           - Payments to unknown LLCs or "Consulting" fees (Potential Shells).
           - Circular transactions or loans from friendly parties (Nominees).
           - Crypto wallet artifacts.

        Evidence:
        {context_text}

        Return ONLY a JSON object with this structure:
        {{
            "assets": [
                {{
                    "entity": "Name of person/company/asset",
                    "type": "Real Estate / Crypto / Shell / Trust / etc.",
                    "suspicion_level": "High/Medium/Low",
                    "reason": "Detailed explanation citing specific evidence and the Scheme ID matched (e.g., scheme_offshore_shell).",
                    "recommended_action": "Specific forensic step (e.g., 'Subpoena Bank X', 'Check Land Registry')."
                }}
            ],
            "risk_score": 0.0 to 1.0,
            "summary": "Executive summary of findings, highlighting the most critical risks."
        }}
        """

        try:
            response = self.llm_service.complete(prompt)
            text = response.text
            
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0]
            elif "```" in text:
                text = text.split("```")[1].split("```")[0]
                
            return json.loads(text.strip())
            
        except Exception as e:
            print(f"Asset Agent Error: {e}")
            return {"assets": [], "risk_score": 0.0, "summary": f"Analysis failed: {str(e)}"}
