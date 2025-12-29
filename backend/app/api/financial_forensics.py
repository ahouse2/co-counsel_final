from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any
from backend.app.services.crypto_service import CryptoService
from backend.app.agents.asset_agent import AssetAgent

router = APIRouter()

@router.post("/crypto/trace", summary="Trace Cryptocurrency Address")
async def trace_crypto(payload: Dict[str, str] = Body(...)) -> Dict[str, Any]:
    """
    Traces a crypto address using real blockchain data.
    Payload: {"address": "...", "chain": "BTC" | "ETH"}
    """
    address = payload.get("address")
    chain = payload.get("chain", "BTC")
    
    if not address:
        raise HTTPException(status_code=400, detail="Address is required")
        
    service = CryptoService()
    result = service.trace_address(address, chain)
    
    # Perform LLM analysis on the result
    if "error" not in result:
        analysis = await service.analyze_with_llm(result)
        result["ai_analysis"] = analysis
        
    return result

@router.post("/assets/scan/{case_id}", summary="Scan for Hidden Assets")
async def scan_assets(case_id: str) -> Dict[str, Any]:
    """
    Scans case documents for hidden asset indicators using the Asset Hunter Swarm.
    """
    from backend.app.agents.swarms.asset_hunter_swarm import AssetHunterSwarm
    from backend.app.services.llm_service import get_llm_service
    from backend.app.services.knowledge_graph_service import get_kg_service
    
    llm_service = get_llm_service()
    kg_service = get_kg_service()
    
    swarm = AssetHunterSwarm(llm_service, kg_service)
    
    # Run the swarm investigation
    result = await swarm.run_investigation(case_id)
    
    return result
