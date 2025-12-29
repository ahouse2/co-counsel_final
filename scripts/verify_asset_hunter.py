
import asyncio
import sys
import os
import unittest.mock
from unittest.mock import MagicMock, AsyncMock

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# MOCK DEPENDENCIES BEFORE IMPORTS
# Mock sqlalchemy
sys.modules["sqlalchemy"] = MagicMock()
sys.modules["sqlalchemy.orm"] = MagicMock()
sys.modules["sqlalchemy.ext.asyncio"] = MagicMock()

# Mock llama_index_factory to avoid all the dynamic import logic
mock_factory = MagicMock()
mock_factory.__spec__ = MagicMock()
sys.modules["backend.ingestion.llama_index_factory"] = mock_factory
mock_factory.create_llm_service = MagicMock()

# Also mock llama_index modules just in case
mock_llama = MagicMock()
mock_llama.__spec__ = MagicMock()
mock_llama.__path__ = []
sys.modules["llama_index"] = mock_llama

mock_llama_core = MagicMock()
mock_llama_core.__spec__ = MagicMock()
mock_llama_core.__path__ = []
sys.modules["llama_index.core"] = mock_llama_core

# Mock submodules
for mod_name in [
    "llama_index.core.node_parser",
    "llama_index.core.schema",
    "llama_index.core.settings",
    "llama_index.embeddings",
    "llama_index.embeddings.huggingface",
    "llama_index.embeddings.openai",
    "llama_index.embeddings.azure_openai",
    "llama_index.llms",
    "llama_index.llms.openai",
    "llama_index.llms.ollama",
    "llama_index.llms.gemini",
    "llama_index.core.extractors",
    "llama_index.vector_stores",
    "llama_index.vector_stores.qdrant",
    "llama_index.readers",
    "llama_index.storage",
    "llama_index.graph_stores"
]:
    m = MagicMock()
    m.__spec__ = MagicMock()
    m.__path__ = [] # Simulate package for all submodules
    sys.modules[mod_name] = m

# Mock services that might import llama_index
mock_llm_service_module = MagicMock()
mock_llm_service_module.__spec__ = MagicMock()
sys.modules["backend.app.services.llm_service"] = mock_llm_service_module
mock_llm_service_module.LLMService = MagicMock
mock_llm_service_module.get_llm_service = MagicMock()

# Mock Knowledge Graph Service
mock_kg_service_module = MagicMock()
mock_kg_service_module.__spec__ = MagicMock()
sys.modules["backend.app.services.knowledge_graph_service"] = mock_kg_service_module
mock_kg_service_module.KnowledgeGraphService = MagicMock
mock_kg_service_module.get_knowledge_graph_service = MagicMock()

# Mock Timeline Service
mock_timeline_module = MagicMock()
mock_timeline_module.__spec__ = MagicMock()
sys.modules["backend.app.services.timeline"] = mock_timeline_module
mock_timeline = MagicMock()
mock_event = MagicMock()
mock_event.summary = "Wire transfer of $5M to Offshore Trust Ltd"
mock_timeline.list_events.return_value = MagicMock(events=[mock_event])
mock_timeline_module.get_timeline_service.return_value = mock_timeline

# Mock services that might import llama_index
mock_llm_service_module = MagicMock()
sys.modules["backend.app.services.llm_service"] = mock_llm_service_module
mock_llm_service_module.LLMService = MagicMock
mock_llm_service_module.get_llm_service = MagicMock()

mock_kg_service_module = MagicMock()
sys.modules["backend.app.services.knowledge_graph_service"] = mock_kg_service_module
mock_kg_service_module.KnowledgeGraphService = MagicMock
mock_kg_service_module.get_knowledge_graph_service = MagicMock()

# Mock Timeline Service
mock_timeline_module = MagicMock()
sys.modules["backend.app.services.timeline"] = mock_timeline_module
mock_timeline = MagicMock()
mock_event = MagicMock()
mock_event.summary = "Wire transfer of $5M to Offshore Trust Ltd"
mock_timeline.list_events.return_value = MagicMock(events=[mock_event])
mock_timeline_module.get_timeline_service.return_value = mock_timeline

# NOW import the swarm
from backend.app.agents.swarms.asset_hunter_swarm import AssetHunterSwarm, CryptoTracingAgent, SchemeDetectorAgent

async def verify_asset_hunter():
    print("🔍 Verifying Asset Hunter Swarm...")

    # 1. Mock Services (passed to constructor)
    mock_llm = MagicMock()
    mock_llm.generate_text = AsyncMock(side_effect=lambda prompt: 
        "Test Target" if "Extract the name" in prompt else 
        json.dumps({
            "risk_score": 0.8, 
            "analysis": "Suspicious activity detected.",
            "related_entities": [{"name": "Offshore Trust Ltd", "type": "Company", "suspicion_level": "high"}],
            "discrepancies": [{"description": "Unexplained wealth", "severity": "high"}]
        })
    )
    
    mock_kg = MagicMock()
    # Mock KG queries
    async def mock_run_cypher(query, params=None):
        if "HAS_WALLET" in query:
            return [{"address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", "chain": "BTC"}]
        if "HAS_INCOME" in query:
            return [{"source": "Tech Corp", "amount": 150000, "position": "Developer"}]
        if "Entity" in query:
             return [{"name": "Offshore Trust Ltd", "type": "Company"}]
        return []
    
    mock_kg.run_cypher_query = AsyncMock(side_effect=mock_run_cypher)

    # 2. Initialize Swarm
    swarm = AssetHunterSwarm(mock_llm, mock_kg)


    
    # 3. Mock CryptoService inside the agent (to avoid real API calls)
    # Access CryptoTracingAgent instance directly
    crypto_agent = swarm.crypto_tracing
    crypto_agent.crypto_service = MagicMock()
    crypto_agent.crypto_service.trace_address = MagicMock(return_value={
        "address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
        "risk_score": 0.9,
        "flags": ["Darknet Market"]
    })
    crypto_agent.crypto_service.analyze_with_llm = AsyncMock(return_value="High risk wallet.")

    # 4. Run Investigation
    print("🚀 Running investigation on 'Test Case'...")
    result = await swarm.run_investigation("test_case_id")
    
    # 5. Verify Results
    print("\n📊 Results:")
    print(f"Status: {result.get('status')}")
    
    aggregated = result.get("aggregated_report", {})
    print(f"Risk Score: {aggregated.get('risk_score')}")
    
    # Check Crypto Agent
    crypto_output = result.get("crypto", {})
    if crypto_output.get("wallets_found") or crypto_output.get("traces"):
        print("✅ CryptoTracingAgent found wallets.")
    else:
        print("❌ CryptoTracingAgent failed to find wallets.")

    # Check Scheme Detector
    scheme_output = result.get("schemes", {})
    if scheme_output:
        print("✅ SchemeDetectorAgent ran.")
        schemes = scheme_output.get("detected_schemes", [])
        if len(schemes) > 0:
             print(f"✅ Detected {len(schemes)} schemes: {[s['scheme'] for s in schemes]}")
        else:
             print("⚠️ No schemes detected (check mock data indicators).")
    else:
        print("❌ SchemeDetectorAgent failed to run.")

    if result.get("total_findings", 0) > 0:
        print("\n✅ Verification SUCCESS")
    else:
        print("\n❌ Verification FAILED")

if __name__ == "__main__":
    asyncio.run(verify_asset_hunter())
