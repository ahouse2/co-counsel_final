from fastapi import APIRouter

router = APIRouter()

@router.get('/bootstrap')
async def halo_bootstrap():
    # Minimal bootstrap payload for halo UI
    return {
        'activeModuleId': 'graph',
        'activeSubmoduleId': 'vector',
        'viewportPayload': None,
    }
