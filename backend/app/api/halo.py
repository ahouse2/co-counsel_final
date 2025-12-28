from fastapi import APIRouter, Depends
from typing import Dict, Any
from backend.app.services.halo_service import HaloService

router = APIRouter()

def get_halo_service():
    return HaloService()

@router.get('/bootstrap')
async def halo_bootstrap(service: HaloService = Depends(get_halo_service)) -> Dict[str, Any]:
    """
    Returns the initial bootstrap state for the Halo UI.
    """
    return await service.get_bootstrap_state()
